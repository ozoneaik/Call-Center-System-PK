<?php

namespace App\Console\Commands;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\Models\Rates;
use App\shopee\ShopeeChatService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class FetchShopeeMessages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'shopee:fetch-messages';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch new Shopee chat messages for all registered shops and save them to the database.';

    private const DEFAULT_SHOPEE_ROOM_ID = 'ROOM06';
    private const RECENT_CONVERSATION_HOURS = 12;
    private const JSON_LOG_OPTIONS = JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;

    public function handle()
    {
        $this->info('Starting to fetch Shopee messages...');
        Log::channel('shopee_cron_job_log')->info('============================================================');
        Log::channel('shopee_cron_job_log')->info('Starting Shopee Message Fetching Job');
        Log::channel('shopee_cron_job_log')->info('============================================================');

        $shops = PlatformAccessTokens::where('platform', 'shopee')->whereNotNull('shopee_shop_id')->get();

        if ($shops->isEmpty()) {
            $this->warn('No Shopee shops found in the database.');
            Log::channel('shopee_cron_job_log')->warning('No Shopee shops configured to fetch.');
            return;
        }

        foreach ($shops as $token) {
            $this->info("Processing shop ID: {$token->shopee_shop_id}");
            Log::channel('shopee_cron_job_log')->info("--- Processing shop ID: {$token->shopee_shop_id} ---");

            try {
                $chatService = new ShopeeChatService(
                    $token->shopee_partner_id,
                    $token->shopee_partner_key,
                    $token->shopee_shop_id,
                    $token->accessToken
                );
                $this->processShopConversations($chatService, $token);
            } catch (\Exception $e) {
                $this->error("An error occurred for shop ID {$token->shopee_shop_id}: " . $e->getMessage());
                Log::channel('shopee_cron_job_log')->error("CronJob Shopee Error for shop {$token->shopee_shop_id}: " . $e->getMessage(), [
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        $this->info('Finished fetching Shopee messages.');
        Log::channel('shopee_cron_job_log')->info('============================================================');
        Log::channel('shopee_cron_job_log')->info('Finished Shopee Message Fetching Job');
        Log::channel('shopee_cron_job_log')->info('============================================================');
    }

    private function processShopConversations(ShopeeChatService $chatService, PlatformAccessTokens $token): void
    {
        $nextCursor = '';
        do {
            $options = ['page_size' => 50];
            if (!empty($nextCursor)) {
                $options['next_cursor'] = $nextCursor;
            }

            $conversationResult = $chatService->getConversationList($options);

            if (!$conversationResult['success'] || empty($conversationResult['data']['conversations'])) {
                Log::channel('shopee_cron_job_log')->warning("Could not fetch conversations for shop {$token->shopee_shop_id}", $conversationResult['details'] ?? []);
                break;
            }

            $conversations = $conversationResult['data']['conversations'];
            $nextCursor = $conversationResult['data']['next_cursor'] ?? null;

            foreach ($conversations as $conv) {
                if ($conv['unread_count'] > 0) {
                    $this->processSingleConversation($chatService, $conv, $token);
                }
            }
        } while (!empty($nextCursor));
    }

    private function processSingleConversation(ShopeeChatService $chatService, array $conv, PlatformAccessTokens $token): void
    {
        Log::channel('shopee_cron_job_log')->info("Processing conversation ID: {$conv['conversation_id']}");
        DB::transaction(function () use ($chatService, $conv, $token) {
            $customer = $this->getOrCreateCustomer($conv, $token);
            $latestRate = Rates::where('custId', $customer->custId)->latest('id')->first();
            $status = $latestRate->status ?? 'new';

            $newMessages = $this->fetchNewMessages($chatService, $conv['conversation_id']);
            if (empty($newMessages)) {
                Log::channel('shopee_cron_job_log')->info("No new messages to save for Shopee conversation {$conv['conversation_id']}.");
                return;
            }

            Log::channel('shopee_cron_job_log')->info("Customer {$customer->custName} has status '{$status}'. Handling " . count($newMessages) . " new message(s).");

            match ($status) {
                'success' => $this->handleSuccessRateMessage($customer, $latestRate, $newMessages, $chatService, $token),
                'progress' => $this->handleProgressRateMessage($customer, $latestRate, $newMessages, $chatService, $token),
                'pending' => $this->handlePendingRateMessage($customer, $latestRate, $newMessages, $chatService, $token),
                default => $this->handleNewMessage($customer, $newMessages, $chatService, $token),
            };
        });
    }
    private function handleNewMessage(Customers $customer, array $newMessages, ShopeeChatService $chatService, PlatformAccessTokens $token): void
    {
        Log::channel('shopee_cron_job_log')->info("Handling as a new message for customer {$customer->custId}.");

        $newRate = Rates::create([
            'custId' => $customer->custId,
            'status' => 'pending',
            'latestRoomId' => self::DEFAULT_SHOPEE_ROOM_ID,
            'rate' => 0,
        ]);

        $newAC = ActiveConversations::create([
            'custId' => $customer->custId,
            'roomId' => self::DEFAULT_SHOPEE_ROOM_ID,
            'rateRef' => $newRate->id,
            'startTime' => Carbon::now(),
        ]);

        foreach ($newMessages as $msg) {
            Log::channel('shopee_message_log')->info('เริ่มกรองข้อความจาก Shopee', [
                'customer' => $customer->toJson(self::JSON_LOG_OPTIONS),
                'message' => json_encode($msg, self::JSON_LOG_OPTIONS),
                'platformAccessToken' => $token->toJson(self::JSON_LOG_OPTIONS),
            ]);

            $currentRate = Rates::query()->where('custId', $customer->custId)->orderBy('id', 'desc')->first();
            $status = $currentRate?->status ?? 'ไม่มีข้อมูล';
            Log::channel('shopee_message_log')->info(" ปัจจุบันเป็นเคส {$status} ");

            $chatData = $this->prepareMessageData($msg, $customer, $newAC->id, $chatService);
            ChatHistory::create($chatData);
        }
        Log::channel('shopee_cron_job_log')->info("SUCCESS: Saved " . count($newMessages) . " new message(s) under new conversationRef {$newAC->id}.");
    }

    private function handlePendingRateMessage(Customers $customer, Rates $rate, array $newMessages, ShopeeChatService $chatService, PlatformAccessTokens $token): void
    {
        Log::channel('shopee_cron_job_log')->info("Handling as a pending message for customer {$customer->custId}.");

        $rate->latestRoomId = self::DEFAULT_SHOPEE_ROOM_ID;
        $rate->save();

        $acRef = ActiveConversations::firstOrCreate(
            ['rateRef' => $rate->id, 'roomId' => self::DEFAULT_SHOPEE_ROOM_ID],
            ['custId' => $customer->custId, 'startTime' => Carbon::now()]
        );

        foreach ($newMessages as $msg) {
            Log::channel('shopee_message_log')->info('เริ่มกรองข้อความจาก Shopee', [
                'customer' => $customer->toJson(self::JSON_LOG_OPTIONS),
                'message' => json_encode($msg, self::JSON_LOG_OPTIONS),
                'platformAccessToken' => $token->toJson(self::JSON_LOG_OPTIONS),
            ]);

            $currentRate = Rates::query()->where('custId', $customer->custId)->orderBy('id', 'desc')->first();
            $status = $currentRate?->status ?? 'ไม่มีข้อมูล';
            Log::channel('shopee_message_log')->info(" ปัจจุบันเป็นเคส {$status} ");

            $chatData = $this->prepareMessageData($msg, $customer, $acRef->id, $chatService);
            ChatHistory::create($chatData);
        }

        Log::channel('shopee_cron_job_log')->info("SUCCESS: Saved " . count($newMessages) . " new message(s) under existing conversationRef {$acRef->id}.");
    }

    private function handleProgressRateMessage(Customers $customer, Rates $rate, array $newMessages, ShopeeChatService $chatService, PlatformAccessTokens $token): void
    {
        Log::channel('shopee_cron_job_log')->info("Handling as a progress message for customer {$customer->custId}.");
        $this->handlePendingRateMessage($customer, $rate, $newMessages, $chatService, $token);
    }

    private function handleSuccessRateMessage(Customers $customer, Rates $rate, array $newMessages, ShopeeChatService $chatService, PlatformAccessTokens $token): void
    {
        Log::channel('shopee_cron_job_log')->info("Handling as a message after success for customer {$customer->custId}.");

        $isRecent = Carbon::now()->diffInHours($rate->updated_at) <= self::RECENT_CONVERSATION_HOURS;

        if ($isRecent) {
            Log::channel('shopee_cron_job_log')->info("Last message was recent. Re-opening conversation.");
            $rate->status = 'pending';
            $rate->save();
            $this->handlePendingRateMessage($customer, $rate, $newMessages, $chatService, $token);
        } else {
            Log::channel('shopee_cron_job_log')->info("Last message was not recent. Starting a new conversation.");
            $this->handleNewMessage($customer, $newMessages, $chatService, $token);
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
            $messageExists = ChatHistory::where('line_message_id', $msg['message_id'])->exists();
            if (!$messageExists) {
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

    /**
     * ดาวน์โหลดและจัดเก็บไฟล์วิดีโอจากลูกค้า Shopee ในรูปแบบที่เข้าถึงได้ง่าย
     */
    private function downloadAndStoreVideo(ShopeeChatService $chatService, string $videoUrl, ?string $videoId, Customers $customer): ?string
    {
        try {
            // สกัดชื่อไฟล์จาก URL ต้นฉบับของ Shopee
            $fileName = null;

            // Pattern สำหรับ Shopee video URL รูปแบบ th-11110133-6kh4c-mcmwt8t8t05c21.default.mp4
            if (preg_match('/\/([a-zA-Z0-9\-_]{20,})\.default\.mp4/', $videoUrl, $matches)) {
                $fileName = $matches[1] . '.mp4'; // ตัด .default ออก
            }
            // Pattern สำหรับไฟล์ .mp4 ปกติ
            elseif (preg_match('/\/([^\/]+\.mp4)(?:\?|$)/', $videoUrl, $matches)) {
                $fileName = $matches[1];
                // ถ้าชื่อไฟล์มี .default.mp4 ให้แปลงเป็น .mp4
                $fileName = str_replace('.default.mp4', '.mp4', $fileName);
            }

            // ถ้าสกัดชื่อไฟล์ไม่ได้ ให้สร้างชื่อใหม่
            if (empty($fileName)) {
                if (!empty($videoId)) {
                    $fileName = $videoId . '.mp4';
                } else {
                    $fileName = 'video_' . time() . '_' . substr(md5($videoUrl), 0, 8) . '.mp4';
                }
            }

            Log::channel('shopee_cron_job_log')->info("Downloading video from customer", [
                'custId' => $customer->custId,
                'fileName' => $fileName,
                'videoUrl' => $videoUrl
            ]);

            // ดาวน์โหลดไฟล์วิดีโอจาก Shopee
            $response = \Illuminate\Support\Facades\Http::timeout(120)->get($videoUrl);

            if ($response->failed()) {
                Log::channel('shopee_cron_job_log')->error("Failed to download video from Shopee", [
                    'custId' => $customer->custId,
                    'fileName' => $fileName,
                    'videoUrl' => $videoUrl,
                    'status' => $response->status()
                ]);
                return null;
            }

            $videoContent = $response->body();
            $contentType = $response->header('Content-Type');

            // ตรวจสอบว่าได้ไฟล์วิดีโอจริงหรือไม่
            if (empty($videoContent) || strlen($videoContent) < 1024) {
                Log::channel('shopee_cron_job_log')->error("Video content is empty or too small", [
                    'custId' => $customer->custId,
                    'fileName' => $fileName,
                    'videoUrl' => $videoUrl,
                    'contentLength' => strlen($videoContent)
                ]);
                return null;
            }

            // สร้าง path สำหรับจัดเก็บโดยตรงใน shopee-videos folder
            $storagePath = 'shopee-videos/' . $fileName;

            // ตรวจสอบว่าไฟล์มีอยู่แล้วหรือไม่ ถ้ามีให้เพิ่ม timestamp
            if (Storage::disk('public')->exists($storagePath)) {
                $pathInfo = pathinfo($fileName);
                $baseName = $pathInfo['filename'];
                $extension = $pathInfo['extension'];
                $fileName = $baseName . '_' . time() . '.' . $extension;
                $storagePath = 'shopee-videos/' . $fileName;
            }

            // สร้างโฟลเดอร์ถ้ายังไม่มี
            $folderPath = dirname($storagePath);
            if (!Storage::disk('public')->exists($folderPath)) {
                Storage::disk('public')->makeDirectory($folderPath);
            }

            // บันทึกไฟล์ลง storage
            $stored = Storage::disk('public')->put($storagePath, $videoContent);

            if (!$stored) {
                Log::channel('shopee_cron_job_log')->error("Failed to store video file", [
                    'custId' => $customer->custId,
                    'fileName' => $fileName,
                    'storagePath' => $storagePath
                ]);
                return null;
            }

            // สร้าง URL สำหรับเข้าถึงไฟล์ในรูปแบบที่ต้องการ
            $baseUrl = config('app.url', 'http://localhost:8000');
            $publicUrl = $baseUrl . '/storage/' . $storagePath;

            Log::channel('shopee_cron_job_log')->info("Successfully stored customer video", [
                'custId' => $customer->custId,
                'fileName' => $fileName,
                'storagePath' => $storagePath,
                'publicUrl' => $publicUrl,
                'fileSize' => strlen($videoContent),
                'contentType' => $contentType
            ]);

            return $publicUrl;
        } catch (\Exception $e) {
            Log::channel('shopee_cron_job_log')->error("Exception while downloading/storing customer video", [
                'custId' => $customer->custId,
                'fileName' => $fileName ?? 'unknown',
                'videoUrl' => $videoUrl,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    private function prepareMessageData(array $msg, Customers $customer, int $conversationRef, ShopeeChatService $chatService): array
    {
        $contentToStore = '';
        $rawContent = $msg['content'];

        if ($msg['message_type'] === 'text') {
            $contentData = is_array($rawContent) ? $rawContent : json_decode($rawContent, true);

            if (is_array($contentData) && isset($contentData['text'])) {
                $contentToStore = $contentData['text'];
            } else {
                $contentToStore = is_string($rawContent) ? $rawContent : json_encode($rawContent);
                Log::channel('shopee_cron_job_log')->warning('Could not extract text from Shopee message content.', ['message' => $msg]);
            }
        } elseif ($msg['message_type'] === 'image') {
            $contentData = is_array($rawContent) ? $rawContent : json_decode($rawContent, true);

            if (is_array($contentData)) {
                $imageUrl = null;
                if (isset($contentData['url'])) {
                    $imageUrl = $contentData['url'];
                } elseif (isset($contentData['image_url'])) {
                    $imageUrl = $contentData['image_url'];
                } elseif (isset($contentData['image_info']['url'])) {
                    $imageUrl = $contentData['image_info']['url'];
                }
                if ($imageUrl) {
                    $contentToStore = $imageUrl;
                    Log::channel('shopee_cron_job_log')->info('Received image message from Shopee customer', [
                        'custId' => $customer->custId,
                        'imageUrl' => $imageUrl,
                        'originalContent' => $rawContent
                    ]);
                } else {
                    $contentToStore = json_encode($contentData);
                    Log::channel('shopee_cron_job_log')->warning('Could not extract image URL from Shopee message content.', [
                        'message' => $msg,
                        'contentData' => $contentData
                    ]);
                }
            } else {
                $contentToStore = is_string($rawContent) ? $rawContent : json_encode($rawContent);
            }
        } elseif ($msg['message_type'] === 'video') {
            $contentData = is_array($rawContent) ? $rawContent : json_decode($rawContent, true);

            if (is_array($contentData)) {
                $videoUrl = null;
                $thumbnailUrl = null;
                $duration = null;
                $videoId = null;

                // ดึงข้อมูลวิดีโอ
                if (isset($contentData['video_url'])) {
                    $videoUrl = $contentData['video_url'];
                } elseif (isset($contentData['url'])) {
                    $videoUrl = $contentData['url'];
                } elseif (isset($contentData['video'])) {
                    $videoUrl = $contentData['video'];
                }

                if (isset($contentData['vid'])) {
                    $videoId = $contentData['vid'];
                } elseif (isset($contentData['video_id'])) {
                    $videoId = $contentData['video_id'];
                }

                if (isset($contentData['thumb_url'])) {
                    $thumbnailUrl = $contentData['thumb_url'];
                } elseif (isset($contentData['thumbnail'])) {
                    $thumbnailUrl = $contentData['thumbnail'];
                }

                if (isset($contentData['duration_seconds'])) {
                    $duration = $contentData['duration_seconds'];
                } elseif (isset($contentData['duration'])) {
                    $duration = $contentData['duration'];
                }

                // ดาวน์โหลดและจัดเก็บไฟล์วิดีโอ
                $localVideoUrl = null;
                if ($videoUrl) {
                    $localVideoUrl = $this->downloadAndStoreVideo($chatService, $videoUrl, $videoId, $customer);
                }

                // **แก้ไขตรงนี้**: บันทึกแค่ URL แทนที่จะเป็น JSON object
                $contentToStore = $localVideoUrl ?: $videoUrl; // ใช้ local URL ถ้ามี, ไม่งั้นใช้ original

                // สร้าง data สำหรับ log เท่านั้น
                $videoDataForLog = [
                    'type' => 'video',
                    'video_url' => $localVideoUrl ?: $videoUrl,
                    'original_video_url' => $videoUrl,
                    'video_id' => $videoId,
                    'thumbnail' => $thumbnailUrl,
                    'duration' => $duration,
                    'width' => $contentData['thumb_width'] ?? $contentData['width'] ?? null,
                    'height' => $contentData['thumb_height'] ?? $contentData['height'] ?? null,
                    'stored_locally' => !is_null($localVideoUrl)
                ];

                $videoDataForLog = array_filter($videoDataForLog, function ($value) {
                    return $value !== null && $value !== '';
                });

                Log::channel('shopee_cron_job_log')->info('Received video message from Shopee customer', [
                    'custId' => $customer->custId,
                    'videoId' => $videoId,
                    'originalVideoUrl' => $videoUrl,
                    'localVideoUrl' => $localVideoUrl,
                    'thumbnailUrl' => $thumbnailUrl,
                    'duration' => $duration,
                    'storedLocally' => !is_null($localVideoUrl),
                    'originalContent' => $rawContent,
                    'processedData' => $videoDataForLog,
                    'finalContentToStore' => $contentToStore // เพิ่ม log นี้เพื่อดูว่าจะบันทึกอะไร
                ]);
            } else {
                $contentToStore = is_string($rawContent) ? $rawContent : json_encode($rawContent);
                Log::channel('shopee_cron_job_log')->warning('Could not process video content from Shopee message.', [
                    'message' => $msg,
                    'rawContent' => $rawContent
                ]);
            }
        } elseif ($msg['message_type'] === 'sticker') {
            $contentData = is_array($rawContent) ? $rawContent : json_decode($rawContent, true);
            if (is_array($contentData)) {
                if (isset($contentData['image_url'])) {
                    $contentToStore = $contentData['image_url'];

                    Log::channel('shopee_cron_job_log')->info('Received sticker message from Shopee customer', [
                        'custId' => $customer->custId,
                        'stickerUrl' => $contentData['image_url'],
                        'stickerId' => $contentData['sticker_id'] ?? 'unknown',
                        'packageId' => $contentData['sticker_package_id'] ?? 'unknown',
                        'originalContent' => $rawContent
                    ]);
                } else {
                    $contentToStore = json_encode($contentData);
                    Log::channel('shopee_cron_job_log')->warning('Could not extract sticker URL from Shopee message content.', [
                        'message' => $msg,
                        'contentData' => $contentData
                    ]);
                }
            } else {
                $contentToStore = is_string($rawContent) ? $rawContent : json_encode($rawContent);
            }
        } else {
            $contentToStore = is_string($rawContent) ? $rawContent : json_encode($rawContent);
            Log::channel('shopee_cron_job_log')->info('Received non-text/non-image message from Shopee', [
                'custId' => $customer->custId,
                'messageType' => $msg['message_type'],
                'content' => $contentToStore,
                'originalContent' => $rawContent
            ]);
        }

        $createdAt = isset($msg['message_time']) ? Carbon::createFromTimestamp($msg['message_time']) : now();

        $senderJson = ($msg['from_id'] == $customer->custId)
            ? $customer->toJson()
            : json_encode(['id' => $msg['from_id'], 'empCode' => '999']);

        return [
            'custId' => $customer->custId,
            'content' => $contentToStore,
            'contentType' => $msg['message_type'],
            'sender' => $senderJson,
            'conversationRef' => $conversationRef,
            'line_message_id' => $msg['message_id'],
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ];
    }
}
