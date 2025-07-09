<?php

namespace App\Http\Controllers\webhooks;

use App\Http\Controllers\Controller;
use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\PlatformAccessTokens;
use App\Models\Customers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Models\Rates;

class FacebookController extends Controller
{
    private $pageAccessToken;
    private $graphApiVersion = 'v19.0';
    private $pageId;

    public function __construct()
    {
        $tokenList = PlatformAccessTokens::query()->where('platform', 'facebook')->get();

        if (app()->environment('local')) {
        }

        if ($tokenList->isNotEmpty()) {
            $this->pageAccessToken = $tokenList[0]->accessToken;
            $this->pageId = $tokenList[0]->fb_page_id;
        } else {
            Log::error('❌ ไม่พบ Facebook token ในฐานข้อมูล');
        }
    }

    // public function webhookFacebook(Request $request)
    // {
    //     // Log::info('>>> Facebook POST webhook called');

    //     // $data = $request->all();
    //     // Log::info($data);

    //     // if (isset($data['object']) && $data['object'] === 'page') {
    //     //     foreach ($data['entry'] as $entry) {
    //     //         if (isset($entry['messaging'])) {
    //     //             foreach ($entry['messaging'] as $messagingEvent) {
    //     //                 // ข้อความเข้า
    //     //                 if (isset($messagingEvent['message']) && empty($messagingEvent['message']['is_echo'])) {
    //     //                     $senderId = $messagingEvent['sender']['id'];
    //     //                     $recipientId = $messagingEvent['recipient']['id'];

    //     //                     // Log ข้อมูล message ทั้งหมด
    //     //                     Log::info('Message payload:', $messagingEvent['message']);

    //     //                     // ดึงข้อความ (ถ้ามี)
    //     //                     $messageText = $messagingEvent['message']['text'] ?? 'No text';

    //     //                     // ตรวจสอบประเภทข้อความ
    //     //                     $messageType = 'text'; // เริ่มต้น
    //     //                     if (isset($messagingEvent['message']['attachments']) && is_array($messagingEvent['message']['attachments'])) {
    //     //                         $messageType = $messagingEvent['message']['attachments'][0]['type'] ?? 'unknown';
    //     //                     }

    //     //                     // Log::channel('facebook_webhook_log')->info($messageText);
    //     //                     // Log::channel('facebook_webhook_log')->info($messageType);

    //     //                     // Log::info("📩 Message from {$senderId} to {$recipientId} (type: {$messageType}): {$messageText}");

    //     //                     // ดึงโปรไฟล์
    //     //                     $senderProfile = $this->getSenderProfile($senderId);
    //     //                     // บันทึกลูกค้า
    //     //                     $this->storeCustomer($senderProfile, $this->getTokenPlatformRef());

    //     //                     $content = $messageText;
    //     //                     $contentType = $messageType;

    //     //                     $this->checkOrCreateRateAndRespond($senderId, $senderProfile['id'], $content, $contentType);

    //     //                     // ตอบกลับแบบเดิม + แสดง JSON payload message (จำกัดความยาว)
    //     //                     $jsonMessage = json_encode($messagingEvent['message'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    //     //                     if (strlen($jsonMessage) > 640) { // Facebook limit ประมาณ 640 ตัวอักษร
    //     //                         $jsonMessage = substr($jsonMessage, 0, 637) . '...';
    //     //                     }

    //     //                     if (str_contains($messageText, 'สวัสดี')) {
    //     //                         $name = $senderProfile['first_name'] ?? 'ผู้ใช้';
    //     //                         $this->sendTextMessage($senderId, "สวัสดีครับคุณ {$name} ผมเป็นช่างครับ ยินดีช่วยเหลือครับ\n\nข้อมูลข้อความ:\n");
    //     //                     } else if (str_contains($messageText, 'ช่าง')) {
    //     //                         $this->sendTextMessage($senderId, "ผมเป็นช่างครับ ยินดีช่วยเหลือครับ\n\nข้อมูลข้อความ:\n");
    //     //                     } else if (str_contains($messageText, 'ทดสอบ')) {
    //     //                         $this->sendTextMessage($senderId, "ทดสอบ\n\nข้อมูลข้อความ:\n");
    //     //                     } else {
    //     //                         $this->sendGenericTemplate($senderId);
    //     //                     }
    //     //                 }

    //     //                 // ข้อความถูกอ่าน
    //     //                 // if (isset($messagingEvent['read'])) {
    //     //                 //     $senderId = $messagingEvent['sender']['id'];
    //     //                 //     $watermark = $messagingEvent['read']['watermark'];
    //     //                 //     $seq = $messagingEvent['read']['seq'] ?? null;
    //     //                 //     $readTime = date('Y-m-d H:i:s', $watermark / 1000);
    //     //                 // }

    //     //                 // Postback
    //     //                 // if (isset($messagingEvent['postback'])) {
    //     //                 //     $senderId = $messagingEvent['sender']['id'];
    //     //                 //     $payload = $messagingEvent['postback']['payload'] ?? 'No payload';

    //     //                 //     Log::info("🎯 ผู้ใช้ {$senderId} กด postback: {$payload}");
    //     //                 //     $this->sendTextMessage($senderId, "คุณเลือก: {$payload}");
    //     //                 // }
    //     //             }
    //     //         }
    //     //     }
    //     // }

    //     return response('EVENT_RECEIVED', 200);
    // }


    // public function webhook(Request $request)
    // {
    //     Log::info('>>> Facebook GET webhook verify called');
    //     // Log::info($request->query());

    //     $verify_token = env('FACEBOOK_WEBHOOK_VERIFY_TOKEN', 'your_verify_token');
    //     $mode = $request->query('hub_mode');
    //     $token = $request->query('hub_verify_token');
    //     $challenge = $request->query('hub_challenge');

    //     if ($mode === 'subscribe' && $token === $verify_token) {
    //         // Log::info('✅ Webhook verified successfully!');
    //         return response($challenge, 200);
    //     }

    //     // Log::error('❌ Webhook verification failed!');
    //     return response('Forbidden', 403);
    // }


    private function getSenderProfile(string $senderId)
    {
        if (!$this->pageAccessToken) return $this->fakeProfile($senderId);

        $url = "https://graph.facebook.com/{$this->graphApiVersion}/{$senderId}";
        $response = Http::get($url, [
            'fields' => 'first_name,last_name,name,profile_pic',
            'access_token' => $this->pageAccessToken,
        ]);

        if ($response->successful()) {
            return $response->json();
        } else {
            Log::warning("⚠️ ดึงโปรไฟล์ไม่สำเร็จสำหรับ senderId: {$senderId} - ใช้ข้อมูลจำลอง");
            return $this->fakeProfile($senderId);
        }
    }

    private function fakeProfile($senderId)
    {
        return [
            'id' => $senderId,
            'name' => "ลูกค้า_{$senderId}",
            'first_name' => 'ลูกค้า',
            'last_name' => $senderId,
            'profile_pic' => null
        ];
    }

    private function storeCustomer(array $profile, int $platformRefId = null)
    {
        $exists = Customers::where('custId', $profile['id'])->exists();
        if ($exists) return;

        Customers::create([
            'custId' => $profile['id'],
            'custName' => $profile['name'] ?? "{$profile['first_name']} {$profile['last_name']}",
            'description' => 'ติดต่อมาจาก Facebook',
            'avatar' => $profile['profile_pic'] ?? null,
            'platformRef' => $platformRefId
        ]);
    }

    private function getTokenPlatformRef()
    {
        $token = PlatformAccessTokens::where('platform', 'facebook')->first();
        return $token?->id;
    }



    private function sendGenericTemplate(string $recipientId)
    {
        if (!$this->pageAccessToken) return;

        $url = "https://graph.facebook.com/{$this->graphApiVersion}/{$this->pageId}/messages";

        $menus = \App\Models\BotMenu::limit(10)->get();

        $elements = [];

        foreach ($menus as $menu) {
            $elements[] = [
                'title' => $menu->menuName,
                'image_url' => 'https://img2.pic.in.th/pic/pic_call1.jpg',
                'subtitle' => 'เลือกเมนูนี้เพื่อดำเนินการต่อ',
                'buttons' => [
                    [
                        'type' => 'postback',
                        'title' => $menu->menuName,
                        'payload' => "SELECTED_MENU_{$menu->id}"
                    ]
                ]
            ];
        }

        $payload = [
            'recipient' => ['id' => $recipientId],
            'message' => [
                'attachment' => [
                    'type' => 'template',
                    'payload' => [
                        'template_type' => 'generic',
                        'elements' => $elements
                    ]
                ]
            ],
            'messaging_type' => 'RESPONSE',
            'access_token' => $this->pageAccessToken
        ];

        $response = Http::post($url, $payload);

        if ($response->successful()) {
            // Log::info("✅ ส่ง Generic Template สำเร็จให้ {$recipientId}");
        } else {
            // Log::error("❌ ส่ง Template ล้มเหลว: " . $response->body());
        }
    }
    private function checkOrCreateRateAndRespond(string $recipientId, string $custId, $content, $contentType)
    {
        $rate = Rates::where('custId', $custId)->orderBy('id', 'desc')->first();
        $customer = Customers::where('custId', $custId)->first();

        if (!$rate) {
            // ยังไม่มีให้สร้างใหม่
            $store_rate = Rates::create([
                'custId' => $custId,
                'rate' => 0,
                'status' => 'pending',
                'latestRoomId' => 'ROOM00'
            ]);
            $store_active = ActiveConversations::create([
                'custId' => $custId,
                'rateRef' => $store_rate->id,
                'roomId' => 'ROOM00',
                'empCode' => 'BOT'
            ]);
            ChatHistory::create([
                'custId' => $custId,
                'empCode' => 'BOT',
                'content' => $content,
                'contentType' => $contentType,
                'sender' => $customer->toJson(),
                'conversationRef' => $store_active->id,
            ]);

            Log::info("✅ สร้าง record ใหม่ใน rates สำหรับลูกค้า {$custId}");
            $this->sendTextMessage($recipientId, "ยินดีต้อนรับคุณ {$customer->custName}\nกรุณาเลือกเมนู:");
            ChatHistory::create([
                'custId' => $custId,
                'empCode' => 'BOT',
                'content' => 'ยินดีต้อนรับคุณ {$customer->custName}\nกรุณาเลือกเมนู:',
                'contentType' => 'text',
                'sender' => $customer->toJson(),
                'conversationRef' => $store_active->id,
            ]);
            ChatHistory::create([
                'custId' => $custId,
                'empCode' => 'BOT',
                'content' => 'บอทส่งเมนู',
                'contentType' => 'text',
                'sender' => $customer->toJson(),
                'conversationRef' => $store_active->id,
            ]);
            return;
        }

        // ถ้ามีแล้ว ดูสถานะ
        $status = $rate->status;

        switch ($status) {
            case 'pending':

                break;

            case 'done':

                break;

            case 'cancelled':

                break;

            default:
                $this->sendTextMessage($recipientId, "สถานะของคุณคือ {$status}");
                break;
        }
    }
}
