<?php

namespace App\Http\Controllers\webhooks;

use App\Services\webhooks\LazadaMessageService;
use App\Http\Controllers\Controller;
use App\Services\PusherService;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\Models\Rates;
use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use App\Services\OcrService;

class LazadaController extends Controller
{
    protected $pusherService;
    public function __construct(PusherService $pusherService)
    {
        $this->pusherService = $pusherService;
    }

    public function handleWebhook(Request $request)
    {
        Log::channel('lazada_webhook_log')->info('--- NEW LAZADA WEBHOOK RECEIVED ---');
        Log::channel('lazada_webhook_log')->info('RAW BODY:', $request->all());

        $messageType = $request->input('message_type');
        $data = $request->input('data');

        try {
            DB::beginTransaction();

            if ($messageType == 2 && isset($data['session_id'])) {
                Log::info('📥 Received Lazada chat message');
                Log::channel('lazada_webhook_log')->info('MESSAGE DATA:', $data);

                $customer = $this->getOrCreateCustomer($data['session_id']);
                Log::info('🧍 ลูกค้า: ' . $customer->custName);

                $this->handleChatMessage($customer, $data);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ Lazada webhook error: ' . $e->getMessage(), ['file' => $e->getFile(), 'line' => $e->getLine()]);
        }

        return response()->json(['code' => '0', 'msg' => 'Processed']);
    }

    private function getOrCreateCustomer($sessionId)
    {
        $customer = Customers::query()->where('custId', $sessionId)->first();

        if (!$customer) {
            $customerName = LazadaMessageService::getCustomerInfo($sessionId);

            $token = PlatformAccessTokens::query()
                ->where('platform', 'lazada')
                ->first();

            if (!$token) {
                throw new \Exception('ไม่พบ Token ที่เชื่อมกับ Lazada');
            }

            return Customers::query()->create([
                'custId' => $sessionId,
                'custName' => $customerName,
                'description' => "ลูกค้าจาก Lazada ({$token->description})",
                'platformRef' => $token->id,
            ]);
        }
        return $customer;
    }

    private function handleChatMessage($customer, $data)
    {
        if (($data['from_account_type'] ?? 0) != 1) {
            return; 
        }

        $messageId = $data['message_id'] ?? null;
        if (!$messageId) return;

        $cacheKey = "lazada_msg_{$messageId}";
        if (Cache::has($cacheKey)) {
            Log::debug("Skipping duplicate message_id: {$messageId}");
            return;
        }
        Cache::put($cacheKey, true, now()->addHour());

        $currentRate = Rates::query()
            ->where('custId', $customer->custId)
            ->orderBy('id', 'desc')
            ->first();

        if ($currentRate && $currentRate->status === 'success') {
            $this->handleSuccessRateMessage($customer, $data, $currentRate);
        } elseif ($currentRate && $currentRate->status === 'progress') {
            $this->handleProgressRateMessage($customer, $data, $currentRate);
        } elseif ($currentRate && $currentRate->status === 'pending') {
            $this->handlePendingRateMessage($customer, $data, $currentRate);
        } else {
            $this->handleNewMessage($customer, $data);
        }
    }

    private function processMessageContent(array $data): array
    {
        $contentData = json_decode($data['content'] ?? '{}', true);
        $result = ['content' => '[ไม่สามารถระบุประเภทข้อความได้]', 'contentType' => 'unknown'];

        $imageUrl = $contentData['imgUrl'] ?? $contentData['img_url'] ?? null;
        if ($imageUrl) {
            $result['content'] = LazadaMessageService::storeMedia($imageUrl);
            $result['contentType'] = 'image';

            return $result;
        }

        if (isset($contentData['txt'])) {
            $result['content'] = $contentData['txt'];
            $result['contentType'] = 'text';
            return $result;
        }

        $videoUrl = $contentData['media_url'] ?? null;
        if ($videoUrl && ($data['type'] ?? 0) == 6) { 
            $result['content'] = LazadaMessageService::storeMedia($videoUrl);
            $result['contentType'] = 'video';
            return $result;
        }

        $templateId = $data['template_id'] ?? null;
        if (in_array($templateId, [3, 4, 5])) {
            $result['content'] = '[ลูกค้าส่ง Sticker/Card/Order]';
            $result['contentType'] = 'card'; 
            return $result;
        }

        return $result;
    }

    private function handleSuccessRateMessage($customer, $raw, $rate)
    {
        $acRef = ActiveConversations::query()->where('rateRef', $rate->id)->orderBy('id', 'desc')->first();
        $processedMessage = $this->processMessageContent($raw);

        ChatHistory::query()->create([
            'custId' => $customer->custId,
            'content' => $processedMessage['content'],
            'contentType' => $processedMessage['contentType'],
            'sender' => $customer->toJson(),
            'conversationRef' => $acRef?->id,
        ]);
        $this->pusherService->sendNotification($customer->custId);
    }

    private function handleProgressRateMessage($customer, $raw, $rate)
    {
        $acRef = ActiveConversations::query()->where('rateRef', $rate->id)->orderBy('id', 'desc')->first();
        $processedMessage = $this->processMessageContent($raw);

        ChatHistory::query()->create([
            'custId' => $customer->custId,
            'content' => $processedMessage['content'],
            'contentType' => $processedMessage['contentType'],
            'sender' => $customer->toJson(),
            'conversationRef' => $acRef?->id,
        ]);

        $menuOptions = [
            '1' => 'รับเรื่องสอบถามสินค้าเรียบร้อยแล้วค่ะ เจ้าหน้าที่จะรีบมาตอบกลับโดยเร็วที่สุดค่ะ',
            '2' => 'รับเรื่องตรวจสอบสถานะคำสั่งซื้อเรียบร้อยแล้วค่ะ เจ้าหน้าที่จะรีบมาตอบกลับโดยเร็วที่สุดค่ะ',
            '3' => 'รับเรื่องติดต่อช่างเรียบร้อยแล้วค่ะ เจ้าหน้าที่จะรีบมาตอบกลับโดยเร็วที่สุดค่ะ',
            '4' => 'รับเรื่องแจ้งเคลมสินค้าเรียบร้อยแล้วค่ะ เจ้าหน้าที่จะรีบมาตอบกลับโดยเร็วที่สุดค่ะ',
        ];

        $lower_message = strtolower(trim($processedMessage['content']));

        if ($processedMessage['contentType'] === 'text' && isset($menuOptions[$lower_message])) {
            Log::info("🤖 Menu option '{$lower_message}' selected by {$customer->custName}.");
            $replyText = $menuOptions[$lower_message];
            $this->sendBotReply($customer->custId, $replyText, $acRef?->id);
        } elseif ($processedMessage['contentType'] === 'text' && $this->messageContainsKeyword($lower_message, ['เมนู', 'menu'])) {
            Log::info("🤖 Keyword detected. Sending menu to {$customer->custName}.");
            $this->sendMenu($customer->custId);
        }

        $this->pusherService->sendNotification($customer->custId);
    }

    private function handlePendingRateMessage($customer, $raw, $rate)
    {
        $acRef = ActiveConversations::query()->where('rateRef', $rate->id)->orderBy('id', 'desc')->first();
        $processedMessage = $this->processMessageContent($raw);

        ChatHistory::query()->create([
            'custId' => $customer->custId,
            'content' => $processedMessage['content'],
            'contentType' => $processedMessage['contentType'],
            'sender' => $customer->toJson(),
            'conversationRef' => $acRef?->id,
        ]);

        $this->sendBotReply($customer->custId, "คิวของคุณถูกจัดเรียบร้อยแล้ว กรุณารอสักครู่...", $acRef?->id);
        $this->pusherService->sendNotification($customer->custId);
    }

    private function handleNewMessage($customer, $raw)
    {
        $newRate = Rates::query()->create(['custId' => $customer->custId, 'status' => 'progress']);
        $newAC = ActiveConversations::query()->create(['custId' => $customer->custId, 'roomId' => 'ROOM00', 'rateRef' => $newRate->id]);

        $processedMessage = $this->processMessageContent($raw);

        ChatHistory::query()->create([
            'custId' => $customer->custId,
            'content' => $processedMessage['content'],
            'contentType' => $processedMessage['contentType'],
            'sender' => $customer->toJson(),
            'conversationRef' => $newAC->id,
        ]);

        $greet = "สวัสดีคุณ {$customer->custName} 🙏 ยินดีต้อนรับสู่ร้านค้า Lazada";
        $this->sendBotReply($customer->custId, $greet, $newAC->id);

        $this->sendMenu($customer->custId);
        $this->pusherService->sendNotification($customer->custId);
    }

    private function sendMenu($sessionId)
    {
        $menu = "กรุณาเลือกเมนูที่ต้องการ:\n1. สอบถามสินค้า\n2. สถานะคำสั่งซื้อ\n3. ติดต่อช่าง\n4. แจ้งเคลม\nพิมพ์เลขที่ต้องการ เช่น \"1\"";
        $this->sendBotReply($sessionId, $menu);
    }

    private function sendBotReply(string $sessionId, string $text, ?int $conversationRef = null)
    {
        LazadaMessageService::sendReply($sessionId, $text);

        if (!$conversationRef) {
            $activeConversation = ActiveConversations::query()->where('custId', $sessionId)->orderBy('id', 'desc')->first();
            $conversationRef = $activeConversation?->id;
        }

        $user_bot = User::query()->where('empCode', 'BOT')->first();
        ChatHistory::query()->create([
            'custId' => $sessionId,
            'content' => $text,
            'contentType' => 'text',
            'sender' => $user_bot ? $user_bot->toJson() : '{"name":"BOT"}',
            'conversationRef' => $conversationRef,
        ]);
    }

    private function messageContainsKeyword(string $message, array $keywords): bool
    {
        foreach ($keywords as $keyword) {
            if (str_contains($message, $keyword)) {
                return true;
            }
        }
        return false;
    }
}
