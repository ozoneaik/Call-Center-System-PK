<?php

namespace App\Services\webhooks;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class LazadaMessageService
{
    public static function storeMedia(?string $mediaUrl): string
    {
        if (!$mediaUrl) {
            return '[ไม่พบ URL ของมีเดีย]';
        }
        try {
            $response = Http::get($mediaUrl);
            if ($response->failed()) {
                Log::error('❌ Failed to download Lazada media', ['url' => $mediaUrl, 'status' => $response->status()]);
                throw new \Exception("Failed to download media from URL: " . $mediaUrl);
            }

            $contentType = $response->header('Content-Type');

            $extension = match ($contentType) {
                'image/jpeg' => '.jpg',
                'image/png'  => '.png',
                'image/gif'  => '.gif',
                'image/webp' => '.webp',
                'video/mp4'  => '.mp4',
                default      => '.jpg',
            };

            $mediaContent = $response->body();
            $mediaPath = 'lazada-media/' . uniqid('lzd_', true) . $extension;
            Storage::disk('public')->put($mediaPath, $mediaContent);
            $fullPath = asset('storage/' . $mediaPath);
            Log::info("✅ Stored Lazada media successfully: {$fullPath}");
            return $fullPath;
        } catch (\Exception $e) {
            Log::channel('lazada_webhook_log')->error($e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return 'ไม่สามารถบันทึกไฟล์มีเดียได้';
        }
    }

    public static function getCustomerInfo(string $sessionId): string
    {
        $accessToken = env('LAZADA_ACCESS_TOKEN');
        $appKey = env('LAZADA_APP_KEY');
        $appSecret = env('LAZADA_APP_SECRET');
        $apiUrl = 'https://api.lazada.co.th/rest';
        $apiPath = '/im/session/get';

        $params = [
            'session_id'   => $sessionId,
            'app_key'      => $appKey,
            'sign_method'  => 'sha256',
            'timestamp'    => round(microtime(true) * 1000),
            'access_token' => $accessToken,
        ];

        ksort($params);
        $stringToSign = $apiPath;
        foreach ($params as $key => $value) {
            $stringToSign .= $key . $value;
        }
        $params['sign'] = strtoupper(hash_hmac('sha256', $stringToSign, $appSecret));

        try {
            $response = Http::get($apiUrl . $apiPath, $params);
            $customerName = $response->json('data.buyer_nick', 'ลูกค้า');
            Log::info('✅ Successfully fetched customer info', ['name' => $customerName]);
            return $customerName;
        } catch (\Exception $e) {
            Log::error('❌ Failed to get customer info', ['error' => $e->getMessage()]);
            return 'ลูกค้า';
        }
    }

    public static function sendReply(string $sessionId, string $replyText): void
    {
        $accessToken = env('LAZADA_ACCESS_TOKEN');
        $appKey = env('LAZADA_APP_KEY');
        $appSecret = env('LAZADA_APP_SECRET');
        $apiUrl = 'https://api.lazada.co.th/rest';
        $apiPath = '/im/message/send';

        $params = [
            'session_id'   => $sessionId,
            'template_id'  => 1,
            'txt'          => $replyText,
            'app_key'      => $appKey,
            'sign_method'  => 'sha256',
            'timestamp'    => round(microtime(true) * 1000),
            'access_token' => $accessToken,
        ];

        ksort($params);
        $stringToSign = $apiPath;
        foreach ($params as $key => $value) {
            $stringToSign .= $key . $value;
        }
        $params['sign'] = strtoupper(hash_hmac('sha256', $stringToSign, $appSecret));

        try {
            $response = Http::asForm()->post($apiUrl . $apiPath, $params);
            $jsonResponse = $response->json();

            if ($response->successful() && isset($jsonResponse['code']) && $jsonResponse['code'] == '0') {
                Log::info('✅ Lazada IM Reply Sent Successfully', ['response' => $jsonResponse]);
            } else {
                Log::error('❌ Lazada API returned an error on reply', ['response' => $jsonResponse]);
            }
        } catch (\Exception $e) {
            Log::error('❌ Failed to send Lazada IM Reply', ['error' => $e->getMessage()]);
        }
    }

    public static function sendImageMessage(string $sessionId, string $imageUrl, $width = 600, $height = 600): void
    {
        $accessToken = env('LAZADA_ACCESS_TOKEN');
        $appKey = env('LAZADA_APP_KEY');
        $appSecret = env('LAZADA_APP_SECRET');
        $apiUrl = 'https://api.lazada.co.th/rest';
        $apiPath = '/im/message/send';

        $params = [
            'session_id'   => $sessionId,
            'template_id'  => 3,
            'img_url'      => $imageUrl,
            'width'        => $width,
            'height'       => $height,
            'app_key'      => $appKey,
            'sign_method'  => 'sha256',
            'timestamp'    => round(microtime(true) * 1000),
            'access_token' => $accessToken,
        ];

        ksort($params);
        $stringToSign = $apiPath;
        foreach ($params as $key => $value) {
            $stringToSign .= $key . $value;
        }
        $params['sign'] = strtoupper(hash_hmac('sha256', $stringToSign, $appSecret));

        try {
            $response = Http::asForm()->post($apiUrl . $apiPath, $params);
            $jsonResponse = $response->json();

            if ($response->successful() && isset($jsonResponse['code']) && $jsonResponse['code'] == '0') {
                Log::info('✅ Lazada image message sent successfully', ['response' => $jsonResponse]);
            } else {
                Log::error('❌ Lazada API returned an error on image message', ['response' => $jsonResponse]);
            }
        } catch (\Exception $e) {
            Log::error('❌ Failed to send image message', ['error' => $e->getMessage()]);
        }
    }

    public static function sendImage(string $sessionId, string $imagePath): void
    {
        Log::channel('lazada_webhook_log')->info("📷 Sending image file path:", ['path' => $imagePath]);
        return;
        $accessToken = env('LAZADA_ACCESS_TOKEN');
        $appKey = env('LAZADA_APP_KEY');
        $appSecret = env('LAZADA_APP_SECRET');
        $apiUrl = 'https://api.lazada.co.th/rest';
        $apiPath = '/im/image/send';

        $params = [
            'session_id'   => $sessionId,
            'app_key'      => $appKey,
            'sign_method'  => 'sha256',
            'timestamp'    => round(microtime(true) * 1000),
            'access_token' => $accessToken,
        ];

        ksort($params);
        $stringToSign = $apiPath;
        foreach ($params as $key => $value) {
            $stringToSign .= $key . $value;
        }
        $params['sign'] = strtoupper(hash_hmac('sha256', $stringToSign, $appSecret));

        try {
            $response = Http::attach(
                'img_file',
                file_get_contents($imagePath),
                basename($imagePath)
            )->post($apiUrl . $apiPath, $params);
            Log::info("📷 Sending image file path:", ['path' => $imagePath]);

            $json = $response->json();
            $imageUrl = $json['data']['image']['url'] ?? $json['data']['url'] ?? null;

            if ($imageUrl) {
                Log::info('✅ Lazada Image Upload Response', ['response' => $json]);

                self::sendImageMessage($sessionId, $imageUrl);
            } else {
                Log::error('❌ Failed to upload image or missing image URL in response', ['response' => $json]);
            }
        } catch (\Exception $e) {
            Log::error('❌ Error while sending image', ['error' => $e->getMessage()]);
        }
    }

    public function sendMessage(string $custId, array $message): array
    {
        try {
            switch ($message['contentType']) {
                case 'text':
                    $this->sendReply($custId, $message['content']);
                    break;

                case 'image':
                    $imageUrl = $message['content'];
                    $width = $message['width'] ?? 600; 
                    $height = $message['height'] ?? 600;
                    Log::channel('lazada_webhook_log')->info("💕 Sending image file path:", ['path' => $message['content']]);
                    $this->sendImageMessage($custId, $imageUrl, $width, $height);
                    break;
                default:
                    throw new \Exception("ไม่รองรับ contentType: " . $message['contentType']);
            }
            return [
                'status' => true,
                'message' => 'ส่งข้อความสำเร็จ',
                'responseJson' => [
                    'message_id' => uniqid('lzd_', true),
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Lazada sendMessage failed: ' . $e->getMessage());
            return [
                'status' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
