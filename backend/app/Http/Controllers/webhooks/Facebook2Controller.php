<?php

namespace App\Http\Controllers\webhooks;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class Facebook2Controller extends Controller
{
    //
    /**
     * จัดการการยืนยัน Webhook จาก Facebook (GET Request)
     */
    public function webhook(Request $request)
    {
        Log::info('>>> Facebook GET webhook verify called');
        Log::info($request->query());

        // แก้ไข: ดึงค่า Verify Token จากไฟล์ .env
        $verify_token = env('FACEBOOK_WEBHOOK_VERIFY_TOKEN');

        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        if ($mode === 'subscribe' && $token === $verify_token) {
            Log::info('WEBHOOK_VERIFIED');
            return response($challenge, 200);
        }

        Log::error('Webhook verification failed.');
        return response('Forbidden', 403);
    }

    /**
     * จัดการ Event ที่ได้รับจาก Facebook (POST Request)
     */
    public function webhookFacebook(Request $request)
    {
        Log::info('>>> Facebook POST webhook called');
        $body = $request->all();
        Log::info($body);

        if (isset($body['object']) && $body['object'] === 'page') {
            foreach ($body['entry'] as $entry) {
                // ตรวจสอบให้แน่ใจว่ามี key 'messaging' อยู่
                if (isset($entry['messaging'])) {
                    $webhookEvent = $entry['messaging'][0];
                    $senderPsid = $webhookEvent['sender']['id'];

                    if (isset($webhookEvent['message'])) {
                        $this->handleMessage($senderPsid, $webhookEvent['message']);
                    }
                }
            }
            return response('EVENT_RECEIVED', 200);
        }

        return response('Not a page object', 404);
    }

    /**
     * จัดการข้อความและสร้างการตอบกลับ
     */
    protected function handleMessage($senderPsid, $receivedMessage)
    {
        // ดึงข้อมูลโปรไฟล์ของผู้ใช้
        $userProfile = $this->getUserProfile($senderPsid);
        $firstName = $userProfile['first_name'] ?? 'เพื่อน'; // ใช้ชื่อจริง ถ้าดึงได้

        $responseText = '';

        if (isset($receivedMessage['text'])) {
            // สร้างข้อความตอบกลับโดยใช้ชื่อของผู้ใช้
            $responseText = 'สวัสดีคุณ ' . $firstName . '! คุณส่งข้อความมาว่า: "' . $receivedMessage['text'] . '"';
        } else {
            $responseText = 'ขออภัย ฉันเข้าใจเฉพาะข้อความตัวอักษรเท่านั้น';
        }

        $this->callSendAPI($senderPsid, ['text' => $responseText]);
    }

    /**
     * เพิ่ม: เรียกใช้ Graph API เพื่อส่งข้อความกลับ
     */
    protected function callSendAPI($senderPsid, $response)
    {
        $pageAccessToken = env('FACEBOOK_PAGE_ACCESS_TOKEN');

        Http::post("https://graph.facebook.com/v18.0/me/messages?access_token={$pageAccessToken}", [
            'recipient' => ['id' => $senderPsid],
            'message' => $response,
            'messaging_type' => 'RESPONSE'
        ]);
    }

    /**
     * ดึงข้อมูลโปรไฟล์ผู้ใช้จาก Graph API
     */
    protected function getUserProfile($senderPsid)
    {
        $pageAccessToken = env('FACEBOOK_PAGE_ACCESS_TOKEN');
        $url = "https://graph.facebook.com/{$senderPsid}?fields=first_name,last_name,profile_pic&access_token={$pageAccessToken}";

        $response = Http::get($url);

        if ($response->successful()) {
            return $response->json();
        }

        Log::error('Failed to get user profile: ' . $response->body());
        return null;
    }
}
