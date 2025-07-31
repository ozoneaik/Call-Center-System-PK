<?php

namespace App\Console\Commands;

use App\Models\ActiveConversations;
use App\Models\BotMenu;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\Keyword;
use App\Models\PlatformAccessTokens;
use App\Models\Rates;
use App\Models\User;
use App\Services\PusherService;
use App\shopee\ShopeeChatService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FetchShopeeMessages extends Command
{
    // region Class Properties & Constructor
    // ===================================================================

    protected $signature = 'shopee:fetch-messages';
    protected $description = 'Fetch new Shopee chat messages for all registered shops and save them to the database.';

    protected PusherService $pusherService;

    private const DEFAULT_BOT_ROOM_ID = 'ROOM00';
    private const DEFAULT_SHOPEE_ROOM_ID = 'ROOM06';
    private const RECENT_CONVERSATION_HOURS = 12;
    private const JSON_LOG_OPTIONS = JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;

    public function __construct(PusherService $pusherService)
    {
        parent::__construct();
        $this->pusherService = $pusherService;
    }

    public function handle()
    {
        while (true) {
            $this->info('Starting to fetch Shopee messages...');
            $shops = PlatformAccessTokens::where('platform', 'shopee')->whereNotNull('shopee_shop_id')->get();
            if ($shops->isEmpty()) {
                $this->warn('No Shopee shops found.');
                return;
            }

            foreach ($shops as $token) {
                $this->info("Processing shop ID: {$token->shopee_shop_id}");
                try {
                    $chatService = new ShopeeChatService(
                        $token->shopee_partner_id,
                        $token->shopee_partner_key,
                        $token->shopee_shop_id,
                        $token->accessToken
                    );
                    $this->processShopConversations($chatService, $token);
                } catch (\Exception $e) {
                    $this->error("Error for shop ID {$token->shopee_shop_id}: " . $e->getMessage());
                    Log::channel('shopee_cron_job_log')->error("Error for shop {$token->shopee_shop_id}: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
                }
            }
            $this->info('Finished fetching Shopee messages.');
            sleep(10);
        }
        return 0;
    }

    private function processShopConversations(ShopeeChatService $chatService, PlatformAccessTokens $token): void
    {
        $nextCursor = '';
        do {
            $options = ['page_size' => 50];
            if (!empty($nextCursor)) $options['next_cursor'] = $nextCursor;

            $conversationResult = $chatService->getConversationList($options);
            if (!$conversationResult['success'] || empty($conversationResult['data']['conversations'])) {
                break;
            }

            $conversations = $conversationResult['data']['conversations'];
            $nextCursor = $conversationResult['data']['next_cursor'] ?? null;

            foreach ($conversations as $conv) {
                if ($conv['unread_count'] > 0) {
                    $this->handleMessages($chatService, $conv, $token);
                }
            }
        } while (!empty($nextCursor));
    }

    private function handleMessages(ShopeeChatService $chatService, array $conv, PlatformAccessTokens $token): void
    {
        $BOT = User::firstOrCreate(['empCode' => 'BOT'], ['name' => 'System Bot', 'email' => 'bot@system.local', 'password' => Hash::make(Str::random(16))]);
        $SHOPEE_AGENT = User::firstOrCreate(['empCode' => 'SHOPEE_AGENT'], ['name' => 'Shopee Agent', 'email' => 'agent.shopee@system.local', 'password' => Hash::make(Str::random(16))]);

        DB::transaction(function () use ($chatService, $conv, $token, $BOT, $SHOPEE_AGENT) {
            $customer = $this->getOrCreateCustomer($conv, $token);
            $latestRate = Rates::where('custId', $customer->custId)->latest('id')->first();
            $status = $latestRate->status ?? 'new';

            $newMessages = $this->fetchNewMessages($chatService, $conv['conversation_id']);
            if (empty($newMessages)) return;

            Log::channel('shopee_cron_job_log')->info("Customer {$customer->custName} has status '{$status}'. Handling " . count($newMessages) . " new message(s).");

            match ($status) {
                'success' => $this->handleSuccessRateMessage($customer, $latestRate, $newMessages, $chatService, $token, $BOT, $SHOPEE_AGENT),
                'progress' => $this->handleProgressRateMessage($customer, $latestRate, $newMessages, $chatService, $token, $BOT, $SHOPEE_AGENT),
                'pending' => $this->handlePendingRateMessage($customer, $latestRate, $newMessages, $chatService, $token, $BOT, $SHOPEE_AGENT),
                default => $this->handleNewMessage($customer, $newMessages, $chatService, $token, $BOT, $SHOPEE_AGENT),
            };

            $this->pusherService->sendNotification($customer->custId);
            Log::channel('shopee_cron_job_log')->info("Pusher notification sent for customer {$customer->custId}.");
        });
    }

    private function handleNewMessage(Customers $customer, array $newMessages, ShopeeChatService $chatService, PlatformAccessTokens $token, User $bot, User $shopeeAgent): void
    {
        $firstMessage = $newMessages[0];

        if ($firstMessage['message_type'] === 'text') {
            $contentData = json_decode($firstMessage['content'], true);
            $text = $contentData['text'] ?? '';

            $keyword = Keyword::query()->where('name', 'like', "%$text%")->first();

            if ($keyword && ($keyword->event ?? false) !== true) {
                Log::channel('shopee_cron_job_log')->info("Keyword '{$text}' found. Routing to room {$keyword->redirectTo}.");
                $this->createNewConversation($customer, $newMessages, $keyword->redirectTo, 'pending', $chatService, $token, $bot, $shopeeAgent);
            } else {
                Log::channel('shopee_cron_job_log')->info("No keyword found. Routing to BOT first.");
                $this->createBotConversation($customer, $newMessages, $chatService, $token, $bot, $shopeeAgent);
            }
        } else {
            Log::channel('shopee_cron_job_log')->info("First message is not text. Routing to BOT first.");
            $this->createBotConversation($customer, $newMessages, $chatService, $token, $bot, $shopeeAgent);
        }
    }

    private function handleSuccessRateMessage(Customers $customer, Rates $rate, array $newMessages, ShopeeChatService $chatService, PlatformAccessTokens $token, User $bot, User $shopeeAgent): void
    {
        $firstMessage = $newMessages[0];

        if ($firstMessage['message_type'] === 'text') {
            $contentData = json_decode($firstMessage['content'], true);
            $text = $contentData['text'] ?? '';

            $keyword = Keyword::query()
                ->where('name', 'like', "%$text%")
                ->where(fn ($q) => $q->where('event', '!=', true)->orWhereNull('event'))
                ->first();

            if ($keyword) {
                Log::channel('shopee_cron_job_log')->info("Returning customer sent keyword '{$text}'. Routing to room {$keyword->redirectTo}.");
                $this->createNewConversation($customer, $newMessages, $keyword->redirectTo, 'pending', $chatService, $token, $bot, $shopeeAgent);
                return;
            }
        }

        $isRecent = Carbon::now()->diffInHours($rate->updated_at) <= self::RECENT_CONVERSATION_HOURS;
        if ($isRecent) {
            Log::channel('shopee_cron_job_log')->info("Recent success case (<12h) replied. Re-opening in last used room: {$rate->latestRoomId}.");
            $this->createNewConversation($customer, $newMessages, $rate->latestRoomId, 'pending', $chatService, $token, $bot, $shopeeAgent);
        } else {
            Log::channel('shopee_cron_job_log')->info("Old success case (>12h) replied. Starting new conversation with BOT.");
            $this->createBotConversation($customer, $newMessages, $chatService, $token, $bot, $shopeeAgent);
        }
    }

    private function handleProgressRateMessage(Customers $customer, Rates $rate, array $newMessages, ShopeeChatService $chatService, PlatformAccessTokens $token, User $bot, User $shopeeAgent): void
    {
        $acRef = ActiveConversations::where('rateRef', $rate->id)->latest('id')->first();

        if (!$acRef) {
            Log::channel('shopee_cron_job_log')->error("Data inconsistency: Found 'progress' rate (ID: {$rate->id}) with no ActiveConversation for customer {$customer->custId}.");
            return;
        }

        if ($rate->latestRoomId === self::DEFAULT_BOT_ROOM_ID) {
            $firstMessage = $newMessages[0];
            $targetRoomId = self::DEFAULT_SHOPEE_ROOM_ID;
            $foundMatch = false;

            if ($firstMessage['message_type'] === 'text') {
                $contentData = json_decode($firstMessage['content'], true);
                $text = trim($contentData['text'] ?? '');

                $menu = BotMenu::where('botTokenId', $customer->platformRef)
                    ->where('menuName', $text)
                    ->first();

                if ($menu) {
                    $targetRoomId = $menu->roomId;
                    $foundMatch = true;
                    Log::channel('shopee_cron_job_log')->info("BotMenu '{$text}' matched. Forwarding to room {$targetRoomId}.");
                } else {
                    $keyword = Keyword::where('name', 'like', "%{$text}%")
                        ->where(fn ($q) => $q->where('event', '!=', true)->orWhereNull('event'))
                        ->first();
                    if ($keyword) {
                        $targetRoomId = $keyword->redirectTo;
                        $foundMatch = true;
                        Log::channel('shopee_cron_job_log')->info("Keyword '{$text}' matched. Forwarding to room {$targetRoomId}.");
                    }
                }
            }

            if (!$foundMatch) {
                Log::channel('shopee_cron_job_log')->info("No menu or keyword match. Forwarding to default room {$targetRoomId}.");
            }

            $this->updateRateAndForwardToRoom($customer, $rate, $acRef, $newMessages, $targetRoomId, $chatService, $token, $bot, $shopeeAgent);
        } else {
            Log::channel('shopee_cron_job_log')->info("Progress case is with an agent. Appending messages.");
            foreach ($newMessages as $msg) {
                $this->storeMessage($msg, $customer, $acRef->id, $shopeeAgent, $chatService, $token);
            }
        }
    }

    private function handlePendingRateMessage(Customers $customer, Rates $rate, array $newMessages, ShopeeChatService $chatService, PlatformAccessTokens $token, User $bot, User $shopeeAgent): void
    {
        $acRef = ActiveConversations::where('rateRef', $rate->id)->latest('id')->first();

        if (!$acRef) {
            Log::channel('shopee_cron_job_log')->error("Data inconsistency: Found 'pending' rate (ID: {$rate->id}) with no ActiveConversation for customer {$customer->custId}.");
            return;
        }

        foreach ($newMessages as $msg) {
            $this->storeMessage($msg, $customer, $acRef->id, $shopeeAgent, $chatService, $token);
        }
        Log::channel('shopee_cron_job_log')->info("Saved " . count($newMessages) . " new message(s) to existing pending conversationRef {$acRef->id}.");

        $queueChat = ActiveConversations::query()
            ->join('rates', 'active_conversations.rateRef', '=', 'rates.id')
            ->where('active_conversations.roomId', $rate->latestRoomId)
            ->where('rates.status', '=', 'pending')
            ->orderBy('active_conversations.created_at', 'asc')
            ->get(['active_conversations.custId']);

        $queuePosition = 1;
        foreach ($queueChat as $queueItem) {
            if ($queueItem->custId == $customer->custId) {
                break;
            }
            $queuePosition++;
        }

        // --- SECTION FOR TESTING: Temporarily disable sending queue message ---
        /*
        $queueMessageText = "คิวของท่านคือ {$queuePosition} คิว กรุณารอสักครู่ค่ะ";

        try {
            $chatService->sendMessage((int)$customer->custId, 'text', ['text' => $queueMessageText]);
            $this->storeSystemMessage($queueMessageText, $customer, $acRef->id, $bot);
            Log::channel('shopee_cron_job_log')->info("Sent queue notification (Position: {$queuePosition}) to customer {$customer->custId}.");
        } catch (\Exception $e) {
            Log::channel('shopee_cron_job_log')->error("Failed to send queue notification to customer {$customer->custId}: " . $e->getMessage());
        }
        */
        Log::channel('shopee_cron_job_log')->info("TEST MODE: Skipped sending queue notification to customer {$customer->custId}.");
    }

    private function createBotConversation(Customers $customer, array $initialMessages, ShopeeChatService $chatService, PlatformAccessTokens $token, User $bot, User $shopeeAgent): void
    {
        $newRate = Rates::create(['custId' => $customer->custId, 'status' => 'progress', 'latestRoomId' => self::DEFAULT_BOT_ROOM_ID, 'rate' => 0]);
        $newAC = ActiveConversations::create(['custId' => $customer->custId, 'roomId' => self::DEFAULT_BOT_ROOM_ID, 'rateRef' => $newRate->id, 'startTime' => now(), 'empCode' => 'BOT']);

        foreach ($initialMessages as $msg) {
            $this->storeMessage($msg, $customer, $newAC->id, $shopeeAgent, $chatService, $token);
        }

        // --- SECTION FOR TESTING: Temporarily disable sending welcome message ---
        /*
        $welcomeText = "สวัสดีค่ะคุณ {$customer->custName} เพื่อให้การบริการของเรารวดเร็วยิ่งขึ้น กรุณาพิมพ์ข้อความเพื่อเลือกหัวข้อด้านล่างได้เลยค่ะ\n\n1. สอบถามข้อมูลสินค้า\n2. ติดตามสถานะคำสั่งซื้อ\n3. แจ้งปัญหาการใช้งาน\n4. ติดต่อเจ้าหน้าที่";

        try {
            $chatService->sendMessage((int)$customer->custId, 'text', ['text' => $welcomeText]);
            $this->storeSystemMessage($welcomeText, $customer, $newAC->id, $bot);
            Log::channel('shopee_cron_job_log')->info("Sent welcome menu to customer {$customer->custId}.");
        } catch (\Exception $e) {
            Log::channel('shopee_cron_job_log')->error("Failed to send welcome menu to customer {$customer->custId}: " . $e->getMessage());
        }
        */
        Log::channel('shopee_cron_job_log')->info("TEST MODE: Skipped sending welcome menu to customer {$customer->custId}.");
    }

    private function createNewConversation(Customers $customer, array $initialMessages, string $roomId, string $status, ShopeeChatService $chatService, PlatformAccessTokens $token, User $bot, User $shopeeAgent): void
    {
        $newRate = Rates::create(['custId' => $customer->custId, 'status' => $status, 'latestRoomId' => $roomId, 'rate' => 0]);
        $newAC = ActiveConversations::create(['custId' => $customer->custId, 'roomId' => $roomId, 'rateRef' => $newRate->id]);

        foreach ($initialMessages as $msg) {
            $this->storeMessage($msg, $customer, $newAC->id, $shopeeAgent, $chatService, $token);
        }

        if ($roomId !== self::DEFAULT_BOT_ROOM_ID) {
            // --- SECTION FOR TESTING: Temporarily disable sending wait message ---
            /*
            $waitText = "ระบบกำลังส่งต่อให้เจ้าหน้าที่ที่รับผิดชอบเพื่อเร่งดำเนินการเข้ามาสนทนา กรุณารอสักครู่";
            try {
                $chatService->sendMessage((int)$customer->custId, 'text', ['text' => $waitText]);
                $this->storeSystemMessage($waitText, $customer, $newAC->id, $bot);
            } catch (\Exception $e) {
                Log::channel('shopee_cron_job_log')->error("Failed to send 'please wait' message: " . $e->getMessage());
            }
            */
            Log::channel('shopee_cron_job_log')->info("TEST MODE: Skipped sending 'please wait' message to customer {$customer->custId}.");
        }
    }

    private function updateRateAndForwardToRoom(Customers $customer, Rates $rate, ActiveConversations $acRef, array $newMessages, string $targetRoomId, ShopeeChatService $chatService, PlatformAccessTokens $token, User $bot, User $shopeeAgent): void
    {
        $rate->status = 'pending';
        $rate->latestRoomId = $targetRoomId;
        $rate->save();

        $acRef->endTime = now();
        $acRef->save();

        $newAc = ActiveConversations::create([
            'custId' => $customer->custId,
            'roomId' => $targetRoomId,
            'rateRef' => $rate->id,
            'from_empCode' => 'BOT',
            'from_roomId' => self::DEFAULT_BOT_ROOM_ID
        ]);

        foreach ($newMessages as $msg) {
            $this->storeMessage($msg, $customer, $newAc->id, $shopeeAgent, $chatService, $token);
        }

        // --- SECTION FOR TESTING: Temporarily disable sending forward message ---
        /*
        $forwardText = "กำลังส่งเรื่องต่อไปยังเจ้าหน้าที่ กรุณารอสักครู่ค่ะ";
        try {
            $chatService->sendMessage((int)$customer->custId, 'text', ['text' => $forwardText]);
            $this->storeSystemMessage($forwardText, $customer, $newAc->id, $bot);
        } catch (\Exception $e) {
            Log::channel('shopee_cron_job_log')->error("Failed to send forwarding message: " . $e->getMessage());
        }
        */
        Log::channel('shopee_cron_job_log')->info("TEST MODE: Skipped sending forwarding message to customer {$customer->custId}.");
    }

    private function storeSystemMessage(string $text, Customers $customer, int $conversationRef, User $sender): void
    {
        ChatHistory::create([
            'custId' => $customer->custId,
            'content' => $text,
            'contentType' => 'text',
            'sender' => $sender->toJson(),
            'conversationRef' => $conversationRef,
            'line_message_id' => 'BOT-' . Str::uuid(),
        ]);
    }

    private function storeMessage(array $msg, Customers $customer, int $conversationRef, User $shopeeAgent, ShopeeChatService $chatService, PlatformAccessTokens $token): void
    {
        $logContext = [
            'customer' => $customer->toJson(self::JSON_LOG_OPTIONS),
            'message' => json_encode($msg, self::JSON_LOG_OPTIONS),
            'platformAccessToken' => $token->toJson(self::JSON_LOG_OPTIONS)
        ];
        Log::channel('shopee_message_log')->info('เริ่มกรองเคส', $logContext);

        $contentToStore = $this->parseMessageContent($msg, $customer, $chatService);
        $sender = ($msg['from_id'] == $customer->custId) ? $customer->toJson() : $shopeeAgent->toJson();
        $createdAt = isset($msg['message_time']) ? Carbon::createFromTimestamp($msg['message_time']) : now();

        ChatHistory::create([
            'custId' => $customer->custId,
            'content' => $contentToStore,
            'contentType' => $msg['message_type'],
            'sender' => $sender,
            'conversationRef' => $conversationRef,
            'line_message_id' => $msg['message_id'],
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);
    }

    private function parseMessageContent(array $msg, Customers $customer, ShopeeChatService $chatService): string
    {
        $rawContent = $msg['content'];
        $contentData = is_array($rawContent) ? $rawContent : json_decode($rawContent, true);

        switch ($msg['message_type']) {
            case 'text':
                return $contentData['text'] ?? (is_string($rawContent) ? $rawContent : json_encode($rawContent));
            case 'image':
                return $contentData['image_url'] ?? $contentData['url'] ?? json_encode($rawContent);
            case 'sticker':
                return $contentData['image_url'] ?? json_encode($rawContent);
            case 'video':
                $videoUrl = $contentData['video_url'] ?? $contentData['url'] ?? null;
                $videoId = $contentData['vid'] ?? $contentData['video_id'] ?? null;
                if ($videoUrl) {
                    $localUrl = $this->downloadAndStoreVideo($videoUrl, $videoId, $customer);
                    return $localUrl ?: $videoUrl;
                }
                return json_encode($rawContent);
            case 'bundle_message':
                $messageCount = count($contentData['messages'] ?? []);
                return "[System Notification: Bundle of {$messageCount} messages]";
            default:
                return is_string($rawContent) ? $rawContent : json_encode($rawContent);
        }
    }

    private function fetchNewMessages(ShopeeChatService $chatService, string $shopeeConversationId): array
    {
        $messageResult = $chatService->getMessages($shopeeConversationId, ['page_size' => 100]);
        if (!$messageResult['success'] || empty($messageResult['data']['messages'])) {
            return [];
        }

        $messagesInChronologicalOrder = array_reverse($messageResult['data']['messages']);
        $newMessagesToSave = [];
        foreach ($messagesInChronologicalOrder as $msg) {
            if (!ChatHistory::where('line_message_id', $msg['message_id'])->exists()) {
                $newMessagesToSave[] = $msg;
            }
        }
        return $newMessagesToSave;
    }

    private function getOrCreateCustomer(array $conv, PlatformAccessTokens $token): Customers
    {
        return Customers::firstOrCreate(
            ['custId' => $conv['to_id'], 'platformRef' => $token->id],
            [
                'custName' => $conv['to_name'],
                'avatar' => $conv['to_avatar'],
                'description' => "ลูกค้าจาก Shopee ({$token->description})",
            ]
        );
    }

    private function downloadAndStoreVideo(string $videoUrl, ?string $videoId, Customers $customer): ?string
    {
        try {
            if (preg_match('/\/([a-zA-Z0-9\-_]{20,})\.default\.mp4/', $videoUrl, $matches)) {
                $fileName = $matches[1] . '.mp4';
            } else {
                $fileName = ($videoId ? $videoId : 'video_' . time() . '_' . Str::random(8)) . '.mp4';
            }

            $response = Http::timeout(120)->get($videoUrl);

            if ($response->failed() || strlen($response->body()) < 1024) {
                Log::channel('shopee_cron_job_log')->error("Failed to download video or content too small.", ['url' => $videoUrl]);
                return null;
            }

            $storagePath = 'shopee-videos/' . $fileName;
            if (Storage::disk('public')->exists($storagePath)) {
                $pathInfo = pathinfo($fileName);
                $fileName = $pathInfo['filename'] . '_' . time() . '.' . $pathInfo['extension'];
                $storagePath = 'shopee-videos/' . $fileName;
            }

            Storage::disk('public')->put($storagePath, $response->body());
            return asset('storage/' . $storagePath);
        } catch (\Exception $e) {
            Log::channel('shopee_cron_job_log')->error("Exception while storing video", ['error' => $e->getMessage(), 'url' => $videoUrl]);
            return null;
        }
    }
}