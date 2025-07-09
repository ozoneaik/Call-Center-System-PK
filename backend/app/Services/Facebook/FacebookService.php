<?php

namespace App\Services\Facebook;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\Models\Rates;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

use function Laravel\Prompts\alert;

class FacebookService
{
    private $pageAccessToken;
    private $graphApiVersion = 'v19.0';
    private $pageId;

    public function getTokenPlatformRef($custId)
    {

        $customer = Customers::query()->where('custId', $custId)->select('platformRef')->first();
        if (isset($customer)) {
            Log::error('customer not found');
        } else {
            Log::info('customer found');
            $token = PlatformAccessTokens::query()->where('id', $customer->platformRef)->select('id')->first();
            return $token?->id;
        }
    }

    public function sendTextMessage(string $senderId, string $recipientId, $message, $accessToken)
    {

        // if (!$this->pageAccessToken) return;

        $url = "https://graph.facebook.com/{$this->graphApiVersion}/{$senderId}/messages";
        $response = Http::post($url, [
            'messaging_type' => 'RESPONSE',
            'recipient' => ['id' => $recipientId],
            'message' => ['text' => $message['content']],
            'access_token' => $accessToken,
        ]);
        Log::info($response->body());

        if ($response->successful()) {
            Log::info("✅ ตอบกลับผู้ใช้ {$recipientId} สำเร็จ");
        } else {
            Log::error('❌ ส่งข้อความล้มเหลวจาก Facebook API: ' . json_encode(json_decode($response->body(), true), JSON_PRETTY_PRINT));
        }
    }

    public function checkOrCreateRateAndRespond(string $recipientId, string $custId, $content, $contentType, $accessToken, $senderId): bool
    {
        $rate = Rates::where('custId', $custId)->orderBy('id', 'desc')->first();
        $customer = Customers::where('custId', $custId)->first();
        $bot = User::where('empCode', 'BOT')->first();

        if (!$rate) {
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
                'content' => $content,
                'contentType' => $contentType,
                'sender' => $customer->toJson(),
                'conversationRef' => $store_active->id,
            ]);

            $this->sendTextMessage(
                $recipientId,
                $senderId,
                ['content' => "ยินดีต้อนรับคุณ {$customer->custName}\nกรุณาเลือกเมนู:"],
                $accessToken
            );

            ChatHistory::create([
                'custId' => $custId,
                'content' => "ยินดีต้อนรับคุณ {$customer->custName}\nกรุณาเลือกเมนู:",
                'contentType' => 'text',
                'sender' => $bot->toJson(),
                'conversationRef' => $store_active->id,
            ]);

            ChatHistory::create([
                'custId' => $custId,
                'content' => 'บอทส่งเมนู',
                'contentType' => 'text',
                'sender' => $bot->toJson(),
                'conversationRef' => $store_active->id,
            ]);

            return true; // ✅ แจ้งว่าเป็นลูกค้าใหม่
        }

        // ถ้ามี rate แล้ว
        $status = $rate->status;

        if ($status === 'pending') {
            $this->sendTextMessage(
                $recipientId,
                $senderId,
                ['content' => "สถานะของคุณคือ : {$status}"],
                $accessToken
            );

            $activeConversation = ActiveConversations::where('custId', $custId)
                ->where('rateRef', $rate->id)
                ->orderBy('id', 'desc')
                ->first();

            ChatHistory::create([
                'custId' => $custId,
                'empCode' => 'BOT',
                'content' => "สถานะของคุณคือ : {$status}",
                'contentType' => 'text',
                'sender' => $bot->toJson(),
                'conversationRef' => $activeConversation?->id,
            ]);
        }

        return false; // ✅ มี rate เดิมแล้ว
    }

    public function saveGetMassage(string $recipientId, $custId, $content, $contentType, $accessToken, $senderId)
    {
        $rate = Rates::where('custId', $custId)->orderBy('id', 'desc')->first();
        $customer = Customers::where('custId', $custId)->first();
        $activeConversation = ActiveConversations::where('custId', $custId)
            ->where('rateRef', $rate->id)
            ->orderBy('id', 'desc')
            ->first();
        Log::info("saveGetMassage");
        ChatHistory::create([
            'custId' => $custId,
            'content' => $content,
            'contentType' => $contentType,
            'sender' => $customer->toJson(),
            'conversationRef' => $activeConversation?->id,
        ]);
    }
    public function getSenderProfile(string $senderId, $accessToken)
    {
        // if (!$this->pageAccessToken) return 
        // $this->fakeProfile($senderId);
        $this->pageAccessToken = $accessToken;

        $url = "https://graph.facebook.com/{$this->graphApiVersion}/{$senderId}";
        $response = Http::get($url, [
            'fields' => 'first_name,last_name,name,profile_pic',
            'access_token' => $this->pageAccessToken,
        ]);

        if ($response->successful()) {
            return [
                $response->json(),
                'pageAccessToken' => $this->pageAccessToken
            ];
        } else {
            Log::warning("⚠️ ดึงโปรไฟล์ไม่สำเร็จสำหรับ senderId: {$senderId} - ใช้ข้อมูลจำลอง");
            return [
                $this->fakeProfile($senderId),
                'pageAccessToken' => $this->pageAccessToken
            ];
            // return $this->fakeProfile($senderId);
        }
    }

    public function fakeProfile($senderId)
    {
        return [
            'id' => $senderId,
            'name' => "ลูกค้า_{$senderId}",
            'first_name' => 'ลูกค้า',
            'last_name' => $senderId,
            'profile_pic' => null
        ];
    }

    public function storeCustomer($profile)
    {
        // ถ้า $profile เป็น array ที่ key 0 คือ profile จริง
        if (is_array($profile) && isset($profile[0]) && is_array($profile[0])) {
            $realProfile = $profile[0];
        } else {
            $realProfile = $profile;
        }

        if (!isset($realProfile['id'])) {
            Log::error('storeCustomer: missing id in profile data');
            return null; // หรือจัดการ error ตามต้องการ
        }

        $customer = Customers::where('custId', $realProfile['id'])->first();

        if (!$customer) {
            $token_list = PlatformAccessTokens::all();
            foreach ($token_list as $t) {
                try {
                    $response_customer = Http::withHeaders([
                        'Authorization' => 'Bearer ' . $t['accessToken'],
                    ])->get("https://graph.facebook.com/{$this->graphApiVersion}/{$realProfile['id']}", [
                        'fields' => 'id,name,first_name,last_name,picture'
                    ]);

                    if ($response_customer->successful()) {
                        $user = $response_customer->json();
                        return Customers::create([
                            'custId' => $user['id'],
                            'custName' => $user['name'] ?? ($user['first_name'] . ' ' . $user['last_name']),
                            'description' => "ติดต่อมาจาก Facebook " . $t['description'],
                            'avatar' => $user['picture']['data']['url'] ?? null,
                            'platformRef' => $t['id']
                        ]);
                    } else {
                        Log::warning("Facebook API response not successful. Status: {$response_customer->status()}, Body: " . $response_customer->body());
                    }
                } catch (\Exception $e) {
                    Log::error("Facebook API error for profile ID {$realProfile['id']} with token ID {$t['id']}: " . $e->getMessage());
                }
            }

            // ถ้าดึงข้อมูลไม่สำเร็จจาก Facebook ทั้งหมด ให้ใช้ fakeProfile แทน
            $fake = $this->fakeProfile($realProfile['id']);
            return Customers::create([
                'custId' => $fake['id'],
                'custName' => $fake['name'],
                'description' => "ติดต่อมาจาก Facebook (ข้อมูลจำลอง)",
                'avatar' => $fake['profile_pic'],
                'platformRef' => '2',
            ]);
        }

        return $customer;
    }
}
