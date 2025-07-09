<?php

namespace App\Http\Controllers\webhooks;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class TiktokController extends Controller
{
    private $appSecret;

    public function __construct()
    {
        $this->appSecret = env('TIKTOK_APP_SECRET');

        if (empty($this->appSecret)) {
            Log::error('TIKTOK_APP_SECRET is not set in .env');
        }
    }

    /**
     * ✅ รับ Webhook จาก TikTok
     */
    public function webhook(Request $request)
    {
        try {
            Log::info('>>> TikTok POST webhook called');

            // ล็อก headers ทั้งหมด
            Log::info('Request Headers:', $request->headers->all());

            // อ่าน header แบบ case-insensitive สำรอง
            $ttSignature = $request->header('X-TT-Signature') ?: $request->header('x-tt-signature');
            Log::info('X-TT-Signature header received: ' . ($ttSignature ?? 'null'));

            $rawBody = $request->getContent();

            // เช็คว่าเป็น sandbox test หรือไม่
            $isTestRequest = empty($ttSignature) && str_contains(strtolower($request->userAgent()), 'go-http-client');

            if ($isTestRequest) {
                Log::info('🧪 TikTok Sandbox Test Request — ข้ามการตรวจลายเซ็น');
            } elseif (!$this->isValidSignature($rawBody, $ttSignature)) {
                Log::warning('❌ TikTok Signature ไม่ถูกต้อง');
                return response('Invalid signature', 401);
            }

            // แปลง payload เป็น array
            $payload = $request->json()->all();
            Log::info('Payload:', $payload);

            if (isset($payload['event'])) {
                switch ($payload['event']) {
                    case 'message_received':
                        $this->handleMessageReceived($payload['data']);
                        break;

                    case 'message_sent':
                        Log::info('📤 ระบบได้ส่งข้อความออกแล้ว');
                        break;

                    default:
                        Log::info("⏳ Event อื่นๆ ที่ยังไม่ได้จัดการ: {$payload['event']}");
                }
            }

            return response('EVENT_RECEIVED', 200);
        } catch (\Exception $e) {
            Log::error($e->getMessage() . ' Line:' . $e->getLine() . ' File:' . $e->getFile());
            Log::info('X-TT-Signature header: ' . ($ttSignature ?? 'null'));
            return response('Server error', 500);
        }
    }


    /**
     * ✅ ตรวจสอบลายเซ็น HMAC จาก TikTok
     */
    private function isValidSignature($payload, $signatureHeader)
    {
        if (!$this->appSecret) return false;

        if (empty($signatureHeader) || !is_string($signatureHeader)) {
            Log::warning('Missing or invalid X-TT-Signature header');
            return false;
        }

        $expectedSignature = base64_encode(hash_hmac('sha256', $payload, $this->appSecret, true));

        Log::info("Expected Signature: {$expectedSignature}");
        Log::info("Received Signature: {$signatureHeader}");

        return hash_equals($expectedSignature, $signatureHeader);
    }

    /**
     * ✅ จัดการข้อความจากลูกค้า
     */
    private function handleMessageReceived(array $data)
    {
        $senderId = $data['sender_id'] ?? null;
        $message  = $data['message'] ?? '';
        $type     = $data['message_type'] ?? 'text';

        Log::info("📩 TikTok Message จาก {$senderId} : {$message} [{$type}]");

        if (str_contains($message, 'ช่าง')) {
            $this->sendTextMessage($senderId, "ช่างพร้อมให้บริการครับ 🙋‍♂️");
        } else {
            $this->sendMenuTemplate($senderId);
        }
    }

    /**
     * ✅ ส่งข้อความกลับไปยัง TikTok Chat (ต้องมี API Access Token)
     */
    private function sendTextMessage(string $recipientId, string $message)
    {
        $accessToken = env('TIKTOK_ACCESS_TOKEN'); // ต้องใช้ OAuth Token จาก TikTok
        if (!$accessToken) {
            Log::error('TIKTOK_ACCESS_TOKEN is not set in .env');
            return;
        }

        $url = "https://open-api.tiktokglobalshop.com/message/send";
        $response = Http::withToken($accessToken)->post($url, [
            'recipient_id' => $recipientId,
            'message_type' => 'text',
            'message' => $message
        ]);

        if ($response->successful()) {
            Log::info("✅ ส่งข้อความกลับหา {$recipientId} สำเร็จ");
        } else {
            Log::error("❌ ส่งข้อความล้มเหลว: " . $response->body());
        }
    }

    /**
     * ✅ ส่งเมนู (Template/ข้อความจำลอง)
     */
    private function sendMenuTemplate(string $recipientId)
    {
        $menus = \App\Models\BotMenu::limit(5)->get();
        $text = "กรุณาเลือกเมนู:\n";

        foreach ($menus as $index => $menu) {
            $text .= ($index + 1) . ". {$menu->menuName}\n";
        }

        $this->sendTextMessage($recipientId, $text);
    }
}
