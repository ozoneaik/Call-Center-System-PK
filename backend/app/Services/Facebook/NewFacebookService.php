<?php

namespace App\Services\Facebook;

use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use Illuminate\Database\Eloquent\Casts\Json;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NewFacebookService
{
    protected string $graphApiVersion = 'v19.0';

    /**
     * ดึงข้อมูลโปรไฟล์ผู้ใช้จาก Facebook
     */
    public function newGetSenderProfile(string $senderId, string $accessToken, string $recipientId): array
    {
        Log::info('📥 เริ่มดึงข้อมูลโปรไฟล์จากผู้ใช้: ' . $senderId);

        $url = "https://graph.facebook.com/{$this->graphApiVersion}/{$senderId}";

        $response = Http::get($url, [
            'fields' => 'first_name,last_name,name,profile_pic',
            'access_token' => $accessToken,
        ]);

        if ($response->successful()) {
            $profile = $response->json();
            $this->formatProfile($profile);
            Log::info('✅ ได้ข้อมูลโปรไฟล์: ' . json_encode($profile, JSON_UNESCAPED_UNICODE));
            return $profile;
        }

        Log::warning("⚠️ ดึงโปรไฟล์ไม่สำเร็จสำหรับ senderId: {$senderId} - ใช้ข้อมูลจำลอง");
        return $this->generateFakeProfile($senderId);
    }

    public function feedFacebook(string $pageId, string $accessToken)
    {
        Log::info("📥 เริ่มดึง feed จากเพจ: {$pageId}");

        try {
            $url = "https://graph.facebook.com/v23.0/{$pageId}/feed";
            // $fields = 'message';
            $limit = 5;
            $fields = 'post_id,message,created_time,full_picture,attachments,from{id,name},likes.summary(true),comments.summary(true),shares';

            $response = Http::get($url, [
                'access_token' => $accessToken,
                'fields' => $fields,
                'limit' => $limit,
            ]);

            if ($response->failed()) {
                Log::error("❌ ดึง feed ไม่สำเร็จจากเพจ {$pageId}", [
                    'error' => $response->json(),
                ]);
                return;
            }

            $feedData = $response->json()['data'] ?? [];

            if (empty($feedData)) {
                Log::warning("⚠️ ไม่มีโพสต์ใด ๆ จากเพจ {$pageId}");
            }

            foreach ($feedData as $index => $post) {
            }
            return $feedData;
        } catch (\Exception $e) {
            Log::error("❌ เกิดข้อผิดพลาดในการดึง feed จากเพจ {$pageId}", [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
            ]);
            return null;
        }
    }

    public function newFeedFacebook(string $pageId, string $accessToken, string $message = '', string $caption = '', array|string|null $imageInput = null)
    {
        Log::info("📥 เริ่มโพสต์ Facebook สำหรับเพจ: {$pageId}");

        if (empty($pageId)) {
            throw new \InvalidArgumentException('Page ID ต้องไม่ว่าง');
        }

        if (empty($accessToken) || strlen($accessToken) < 50) {
            throw new \InvalidArgumentException('Access Token ไม่ถูกต้อง');
        }

        // แปลง string เป็น array ถ้า input เป็นรูปเดี่ยว
        $imageUrls = [];

        if (is_string($imageInput) && !empty($imageInput)) {
            $imageUrls = [$imageInput];
        } elseif (is_array($imageInput)) {
            $imageUrls = $imageInput;
        }

        // ถ้าข้อความ, caption, รูปว่างหมด
        if (empty($message) && empty($caption) && empty($imageUrls)) {
            throw new \InvalidArgumentException('ต้องมีอย่างน้อย message, caption หรือรูปภาพ');
        }

        // ✅ เคส 1: มีหลายภาพ → ใช้ attached_media
        if (count($imageUrls) > 1) {
            $mediaIds = [];
            foreach ($imageUrls as $url) {
                if (!filter_var($url, FILTER_VALIDATE_URL)) {
                    throw new \InvalidArgumentException("Image URL ไม่ถูกต้อง: {$url}");
                }

                $upload = Http::post("https://graph.facebook.com/v23.0/{$pageId}/photos", [
                    'access_token' => $accessToken,
                    'url' => $url,
                    'published' => false,
                ]);

                if ($upload->failed()) {
                    Log::error('❌ Upload รูปล้มเหลว', ['response' => $upload->json()]);
                    throw new \Exception('อัปโหลดภาพล้มเหลว: ' . $upload->body());
                }

                $mediaIds[] = ['media_fbid' => $upload->json()['id']];
            }

            $postData = [
                'access_token' => $accessToken,
                'message' => $message ?: $caption,
            ];

            foreach ($mediaIds as $index => $media) {
                $postData["attached_media[{$index}]"] = json_encode($media);
            }

            $response = Http::post("https://graph.facebook.com/v23.0/{$pageId}/feed", $postData);
        } elseif (count($imageUrls) === 1) {
            // ✅ เคส 2: ภาพเดี่ยว
            $response = Http::post("https://graph.facebook.com/v23.0/{$pageId}/photos", [
                'access_token' => $accessToken,
                'caption' => $caption ?: $message,
                'url' => $imageUrls[0],
            ]);
        } else {
            // ✅ เคส 3: ข้อความล้วน
            $response = Http::post("https://graph.facebook.com/v23.0/{$pageId}/feed", [
                'access_token' => $accessToken,
                'message' => $message,
            ]);
        }

        Log::info('📤 Facebook ตอบกลับ: ' . $response->body());

        if ($response->failed()) {
            Log::error('❌ ไม่สามารถโพสต์ได้', ['response' => $response->json()]);
            throw new \Exception('โพสต์ไม่สำเร็จ: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * สร้างข้อมูลโปรไฟล์จำลอง (fallback)
     */
    protected function generateFakeProfile(string $senderId): array
    {
        $fakeProfile = [
            'id' => $senderId,
            'name' => "ลูกค้า_{$senderId}",
            'first_name' => 'ลูกค้า',
            'last_name' => $senderId,
            'profile_pic' => null
        ];

        Log::info('📥 ใช้ข้อมูลโปรไฟล์จำลอง: ' . json_encode($fakeProfile, JSON_UNESCAPED_UNICODE));
        return $fakeProfile;
    }

    /**
     * จำลองการบันทึกข้อมูลลูกค้า
     */
    public function newStoreCustomer(array $profile, $recipientId)
    {
        Log::info('📥 บันทึกข้อมูลลูกค้า: ' . json_encode($profile, JSON_UNESCAPED_UNICODE));

        $realProfile = is_array($profile) && isset($profile[0]) ? $profile[0] : $profile;

        if (!isset($realProfile['id'])) {
            Log::error('storeCustomer: missing id in profile data');
            return null;
        }

        $customer = Customers::where('custId', $realProfile['id'])->first();

        if (!$customer) {
            // หา platform จาก fb_page_id
            $platform = PlatformAccessTokens::where('fb_page_id', $recipientId)->first();

            $platformId = $platform?->id ?? null;
            $platformDescription = $platform?->description ?? 'ไม่ทราบเพจ';

            Log::info("📥 สร้างลูกค้าใหม่จากเพจ: {$recipientId}, platformRef: {$platformId}");

            $profile = Customers::create([
                'custId' => $realProfile['id'],
                'custName' => $realProfile['name'] ?? ($realProfile['first_name'] . ' ' . $realProfile['last_name']),
                'description' => "ติดต่อมาจาก Facebook " . $platformDescription,
                'avatar' => $realProfile['profile_pic'] ?? null,
                'platformRef' => $platformId
            ]);
        }

        return $profile;
    }

    public function formatProfile($profile)
    {
        // Log ข้อความ "test" เพื่อดูว่าเข้า function หรือยัง
        Log::info("test");

        // Log ข้อมูล $profile ที่รับเข้ามา
        Log::error($profile);

        // ดึงค่า 'id' จาก profile
        $custId = $profile['id'];

        // ค้นหา Customers ที่มี custId ตรงกับ $custId
        $listProfile = Customers::where('custId', $custId)->first();

        // Log ข้อมูล profile ที่หาได้
        $listAccessToken = PlatformAccessTokens::where('id', $listProfile->platformRef)->first();



        // ยังไม่มีการ return ค่าใด ๆ
        return;
    }

    public function formatMessage($message)
    {
        $attachments = $message['message']['attachments'] ?? [];
        $senderId = $message['sender']['id'] ?? null;
        $recipientId = $message['recipient']['id'] ?? null;
        $textId = $message['message']['mid'] ?? null;

        $MESSAGE = [];

        Log::info("📥 ข้อมูลจาก webhook: " . json_encode($message, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        if (!empty($attachments)) {
            Log::info("🖼️ ประเภทข้อความ: image");
            $imageUrls = [];

            foreach ($attachments as $index => $attachment) {
                $type = $attachment['type'] ?? 'unknown';
                $url = $attachment['payload']['url'] ?? null;

                $MESSAGE[$index]['content'] = $url;
                $MESSAGE[$index]['contentType'] = $type;
                $MESSAGE[$index]['facebook_message_id'] = $textId;
                
                Log::info("🖼️ Attachment #{$index}");
                Log::info("👉 type: " . $type);
                Log::info("👉 url: " . $url);

                if ($type === 'image' && $url) {
                    $imageUrls[] = $url;
                }
            }

            Log::info("👤 sender_id: " . $senderId);
            Log::info("📩 recipient_id: " . $recipientId);
            Log::info("🆔 message_id (mid): " . $textId);

            return [
                'sender_id' => $senderId,
                'recipient_id' => $recipientId,
                'type' => 'image',
                'mid' => $textId,
                'payload' => $imageUrls,
            ];
        } else {
            $text = $message['message']['text'] ?? null;

            Log::info("✉️ ประเภทข้อความ: text");
            Log::info("👤 sender_id: " . $senderId);
            Log::info("📩 recipient_id: " . $recipientId);
            Log::info("🆔 message_id (mid): " . $textId);
            Log::info("📝 payload (text): " . $text);

            return [
                'sender_id' => $senderId,
                'recipient_id' => $recipientId,
                'type' => 'text',
                'mid' => $textId,
                'payload' => $text,
            ];
        }
    }

    public function getTokenFeed($id)
    {
        $token_list = PlatformAccessTokens::where('$id', $id)->first();
    }
}
