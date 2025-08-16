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
use Illuminate\Support\Facades\Validator;

class LazadaController extends Controller
{
    protected $pusherService;
    protected string $start_log_line = '--------------------------------------------------🌞 เริ่มรับ webhook--------------------------------------------------';
    protected string $end_log_line = '---------------------------------------------------🌚 สิ้นสุดรับ webhook---------------------------------------------------';

    public function __construct(PusherService $pusherService)
    {
        $this->pusherService = $pusherService;
    }

    public function handleWebhook(Request $request)
    {
        Log::channel('lazada_webhook_log')->info($this->start_log_line);
        $data = $request->all();
        if (isset($data['data']['from_account_type'])) {
            $senderType = match ($data['data']['from_account_type']) {
                1 => 'ลูกค้า',
                2 => 'ร้านค้า',
                3 => 'ระบบ',
                default => 'ไม่ทราบ',
            };

            $data['data']['from_account_type'] = "{$data['data']['from_account_type']} ({$senderType})";
        }
        Log::channel('lazada_webhook_log')->info(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        $messageType = $request->input('message_type');
        $data = $request->input('data');

        try {
            DB::beginTransaction();

            if ($messageType == 2 && isset($data['session_id'])) {
                $customer = $this->getOrCreateCustomer($data['session_id']);

                $senderType = match ($data['from_account_type'] ?? null) {
                    1 => 'ลูกค้า',
                    2 => 'ร้านค้า',
                    3 => 'ระบบ',
                    default => 'ไม่ทราบ',
                };

                $senderId = $data['from_user_id'] ?? '-';
                Log::channel('lazada_webhook_log')->info("ได้รับข้อความจาก: {$senderType}");

                $this->handleChatMessage($customer, $data);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::channel('lazada_webhook_log')->error('❌ Lazada webhook error: ' . json_encode([
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }

        Log::channel('lazada_webhook_log')->info($this->end_log_line);

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
        if (($data['from_account_type'] ?? 0) != 1) return;

        $messageId = $data['message_id'] ?? null;
        if (!$messageId) return;

        $cacheKey = "lazada_msg_{$messageId}";
        if (Cache::has($cacheKey)) return;
        Cache::put($cacheKey, true, now()->addHour());

        $processedMessage = $this->processMessageContent($data);
        $platform = PlatformAccessTokens::find($customer->platformRef);

        Log::channel('lazada_webhook_log')->info("เริ่มกรองเคส", [
            'customer' => json_encode($customer->toArray(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            'message' => json_encode($processedMessage, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            'platformAccessToken' => json_encode($platform?->toArray(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        ]);

        $currentRate = Rates::query()->where('custId', $customer->custId)->orderBy('id', 'desc')->first();
        $status = $currentRate?->status ?? 'ไม่มีข้อมูล';
        Log::channel('lazada_webhook_log')->info("ปัจจุบันเป็นเคส {$status} " . __FILE__ . __LINE__);

        if ($currentRate && $status === 'success') {
            $this->handleSuccessRateMessage($customer, $data, $currentRate);
        } elseif ($currentRate && $status === 'progress') {
            $this->handleProgressRateMessage($customer, $data, $currentRate);
        } elseif ($currentRate && $status === 'pending') {
            $this->handlePendingRateMessage($customer, $data, $currentRate);
        } else {
            $this->handleNewMessage($customer, $data);
        }
    }

    private function processMessageContent(array $data): array
    {
        $contentData = json_decode($data['content'] ?? '{}', true);
        $result = ['content' => '[ไม่สามารถระบุประเภทข้อความได้]', 'contentType' => 'unknown'];

        $templateId = $data['template_id'] ?? null;
        $msgType    = $data['type'] ?? null;

        // ✅ จับวิดีโอจาก template_id=6 หรือมี videoId/videoKey
        $videoId  = $contentData['videoId']  ?? $contentData['video_id'] ?? null;
        $videoKey = $contentData['videoKey'] ?? null;

        if ($templateId == 6 || $msgType == 6 || $videoId || $videoKey) {
            $videoUrl = \App\Services\webhooks\LazadaMessageService::resolveVideoUrl($videoId, $videoKey);
            if ($videoUrl) {
                $result['content'] = \App\Services\webhooks\LazadaMessageService::storeMedia($videoUrl, 'video');
                $result['contentType'] = 'video';
                return $result;
            }
            // ถ้าดึง URL ไม่ได้ ให้ตกลงมาใช้ thumbnail แต่ยังคง contentType เป็น 'video' เพื่อให้ UI เรนเดอร์ <video>
            if (isset($contentData['imgUrl']) || isset($contentData['img_url'])) {
                $thumb = $contentData['imgUrl'] ?? $contentData['img_url'];
                $result['content'] = \App\Services\webhooks\LazadaMessageService::storeMedia($thumb, 'image');
                $result['contentType'] = 'video'; // บอก UI ว่านี่คือวิดีโอ (แค่โชว์ภาพแทนชั่วคราว)
                return $result;
            }
        }

        // การ์ดสินค้า
        if ($templateId == 10006 && isset($contentData['title'])) {
            $result['content'] = "[ลูกค้าส่งข้อมูลสินค้า: {$contentData['title']}]";
            $result['contentType'] = 'card';
            return $result;
        }

        // รูปภาพ
        if (isset($contentData['imgUrl']) || isset($contentData['img_url'])) {
            $imageUrl = $contentData['imgUrl'] ?? $contentData['img_url'];
            $result['content'] = \App\Services\webhooks\LazadaMessageService::storeMedia($imageUrl, 'image');
            $result['contentType'] = 'image';
            return $result;
        }

        // ข้อความ
        if (isset($contentData['txt'])) {
            $result['content'] = $contentData['txt'];
            $result['contentType'] = 'text';
            return $result;
        }

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

        $this->pusherService->sendNotification($customer->custId);
        $menuOptions = [
            '1' => 'รับเรื่องสอบถามสินค้าเรียบร้อยแล้วค่ะ เจ้าหน้าที่จะรีบมาตอบกลับโดยเร็วที่สุดค่ะ',
            '2' => 'รับเรื่องตรวจสอบสถานะคำสั่งซื้อเรียบร้อยแล้วค่ะ เจ้าหน้าที่จะรีบมาตอบกลับโดยเร็วที่สุดค่ะ',
            '3' => 'รับเรื่องติดต่อช่างเรียบร้อยแล้วค่ะ เจ้าหน้าที่จะรีบมาตอบกลับโดยเร็วที่สุดค่ะ',
            '4' => 'รับเรื่องแจ้งเคลมสินค้าเรียบร้อยแล้วค่ะ เจ้าหน้าที่จะรีบมาตอบกลับโดยเร็วที่สุดค่ะ',
        ];

        $lower_message = strtolower(trim($processedMessage['content']));

        if ($processedMessage['contentType'] === 'text' && isset($menuOptions[$lower_message])) {
            Log::channel('lazada_webhook_log')->info("🤖 Menu option '{$lower_message}' selected by {$customer->custName}.");
            $replyText = $menuOptions[$lower_message];
            $this->sendBotReply($customer->custId, $replyText, $acRef?->id);
        } elseif ($processedMessage['contentType'] === 'text' && $this->messageContainsKeyword($lower_message, ['เมนู', 'menu'])) {
            Log::channel('lazada_webhook_log')->info("🤖 Keyword detected. Sending menu to {$customer->custName}.");
            $this->sendMenu($customer->custId);
        }
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
        $newRate = Rates::query()->create([
            'custId' => $customer->custId,
            'status' => 'progress',
            'rate'   => 0,
            'latestRoomId' => 'ROOM00'
        ]);

        $newAC = ActiveConversations::query()->create(['custId' => $customer->custId, 'roomId' => 'ROOM00', 'rateRef' => $newRate->id]);

        $processedMessage = $this->processMessageContent($raw);

        ChatHistory::query()->create([
            'custId' => $customer->custId,
            'content' => $processedMessage['content'],
            'contentType' => $processedMessage['contentType'],
            'sender' => $customer->toJson(),
            'conversationRef' => $newAC->id,
        ]);

        $greet = "สวัสดีคุณ {$customer->custName} ยินดีต้อนรับสู่ร้านค้า Pumpkin 🙏";
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
        $this->pusherService->sendNotification($sessionId);
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

    public function sign(Request $request)
    {
        $v = Validator::make($request->all(), [
            'api_path'             => ['required', 'string', 'starts_with:/'],
            'params'               => ['nullable', 'array'],
            'include_access_token' => ['nullable', 'boolean'],
        ]);

        if ($v->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation error',
                'errors'  => $v->errors(),
            ], 422);
        }

        $apiPath  = $request->input('api_path');
        $params   = $request->input('params', []);
        $withTok  = $request->boolean('include_access_token', true);

        $commonParams = [
            'app_key'     => env('LAZADA_APP_KEY'),
            'sign_method' => 'sha256',
            'timestamp'   => (int) round(microtime(true) * 1000),
        ];

        if ($withTok) {
            $commonParams['access_token'] = env('LAZADA_ACCESS_TOKEN');
        }

        // รวมและเรียงคีย์
        $merged = array_merge($commonParams, $params);
        ksort($merged);

        // Build stringToSign = apiPath + (key + value ... เฉพาะ scalar)
        $stringToSign = $apiPath;
        foreach ($merged as $key => $value) {
            if (is_scalar($value)) {
                $stringToSign .= $key . (string) $value;
            }
        }

        // สร้าง sign
        $secret = env('LAZADA_APP_SECRET');
        $merged['sign'] = strtoupper(hash_hmac('sha256', $stringToSign, $secret));

        return response()->json([
            'status'        => true,
            'api_path'      => $apiPath,
            'signed_params' => $merged,
        ]);
    }

    public function sendVideoTest(Request $request)
    {
        $request->validate([
            'session_id' => 'required|string',
            'video' => 'required|file|mimetypes:video/mp4,video/quicktime,video/webm|max:51200', // <= 50MB
        ]);

        // เก็บไฟล์ลง storage ชั่วคราว
        $path = $request->file('video')->store('tmp_lazada_videos', 'local');
        $fullPath = storage_path('app/' . $path);

        try {
            LazadaMessageService::sendVideo($request->input('session_id'), $fullPath);
            return response()->json([
                'status' => true,
                'message' => 'Video sent successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
