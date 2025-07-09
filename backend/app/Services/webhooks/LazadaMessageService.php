<?php

namespace App\Services\webhooks;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class LazadaMessageService
{
    // public static function storeMedia(?string $mediaUrl): array
    // {
    //     if (!$mediaUrl) {
    //         return ['url' => '[ไม่พบ URL ของมีเดีย]', 'local_path' => null];
    //     }

    //     try {
    //         $response = Http::get($mediaUrl);

    //         if ($response->failed()) {
    //             Log::error('❌ Failed to download Lazada media', [
    //                 'url' => $mediaUrl,
    //                 'status' => $response->status()
    //             ]);
    //             throw new \Exception("Failed to download media from URL: " . $mediaUrl);
    //         }

    //         $contentType = $response->header('Content-Type');
    //         $extension = match ($contentType) {
    //             'image/jpeg' => '.jpg',
    //             'image/png'  => '.png',
    //             'image/gif'  => '.gif',
    //             'image/webp' => '.webp',
    //             'video/mp4'  => '.mp4',
    //             default      => '.jpg',
    //         };

    //         $mediaContent = $response->body();
    //         $mediaPath = 'lazada-media/' . uniqid('lzd_', true) . $extension;

    //         Storage::disk('public')->put($mediaPath, $mediaContent);
    //         $url = asset('storage/' . $mediaPath);
    //         $localPath = public_path('storage/' . $mediaPath);

    //         Log::info("✅ Stored Lazada media successfully: {$url}");

    //         return [
    //             'url' => $url,
    //             'local_path' => $localPath,
    //         ];
    //     } catch (\Exception $e) {
    //         Log::channel('lazada_webhook_log')->error($e->getMessage(), [
    //             'file' => $e->getFile(),
    //             'line' => $e->getLine()
    //         ]);
    //         return ['url' => 'ไม่สามารถบันทึกไฟล์มีเดียได้', 'local_path' => null];
    //     }
    // }


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

        // try {
        //     $response = Http::asForm()->post($apiUrl . $apiPath, $params);
        //     Log::info('✅ Lazada IM Reply Sent Successfully', ['response' => $response->json()]);
        // } catch (\Exception $e) {
        //     Log::error('❌ Failed to send Lazada IM Reply', ['error' => $e->getMessage()]);
        // }
        try {
            $response = Http::asForm()->post($apiUrl . $apiPath, $params);
            $jsonResponse = $response->json(); // อ่านค่า json จาก response

            // ตรวจสอบว่า API สำเร็จหรือไม่ (Lazada จะตอบกลับ code '0' เมื่อสำเร็จ)
            if ($response->successful() && isset($jsonResponse['code']) && $jsonResponse['code'] == '0') {
                Log::info('✅ Lazada IM Reply Sent Successfully', ['response' => $jsonResponse]);
            } else {
                // ถ้าไม่สำเร็จ ให้ Log เป็น error แทน
                Log::error('❌ Lazada API returned an error on reply', ['response' => $jsonResponse]);
            }
        } catch (\Exception $e) {
            Log::error('❌ Failed to send Lazada IM Reply', ['error' => $e->getMessage()]);
        }
    }

    private static function sendImageMessage(string $sessionId, string $imageUrl): void
    {
        $accessToken = env('LAZADA_ACCESS_TOKEN');
        $appKey = env('LAZADA_APP_KEY');
        $appSecret = env('LAZADA_APP_SECRET');
        $apiUrl = 'https://api.lazada.co.th/rest';
        $apiPath = '/im/message/send';

        $imageSize = getimagesize($imageUrl);
        $width = $imageSize[0] ?? 600; 
        $height = $imageSize[1] ?? 600;

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

            $json = $response->json();

            if (isset($json['data']['image']['url'])) {
                $imageUrl = $json['data']['image']['url'];

                self::sendImageMessage($sessionId, $imageUrl);
            } else {
                Log::error('❌ Failed to upload image', ['response' => $json]);
            }
        } catch (\Exception $e) {
            Log::error('❌ Error while sending image', ['error' => $e->getMessage()]);
        }
    }

    // public static function sendImage(string $sessionId, string $imagePath): void
    // {
    //     $accessToken = env('LAZADA_ACCESS_TOKEN');
    //     $appKey = env('LAZADA_APP_KEY');
    //     $appSecret = env('LAZADA_APP_SECRET');
    //     $apiUrl = 'https://api.lazada.co.th/rest';
    //     $apiPath = '/im/image/send';

    //     $params = [
    //         'session_id'   => $sessionId,
    //         'app_key'      => $appKey,
    //         'sign_method'  => 'sha256',
    //         'timestamp'    => round(microtime(true) * 1000),
    //         'access_token' => $accessToken,
    //     ];

    //     ksort($params);
    //     $stringToSign = $apiPath;
    //     foreach ($params as $key => $value) {
    //         $stringToSign .= $key . $value;
    //     }
    //     $params['sign'] = strtoupper(hash_hmac('sha256', $stringToSign, $appSecret));

    //     try {
    //         $response = Http::attach(
    //             'img_file',
    //             file_get_contents($imagePath),
    //             basename($imagePath)
    //         )->post($apiUrl . $apiPath, $params);

    //         $json = $response->json();
    //         if (isset($json['data']['url'])) {
    //             $imageUrl = $json['data']['url'];

    //             // ส่งข้อความแสดงรูป
    //             self::sendImageMessage($sessionId, $imageUrl);
    //         } else {
    //             Log::error('❌ Failed to upload image', ['response' => $json]);
    //         }
    //     } catch (\Exception $e) {
    //         Log::error('❌ Error while sending image', ['error' => $e->getMessage()]);
    //     }
    // }

    // private static function sendImageMessage(string $sessionId, string $imageUrl): void
    // {
    //     $accessToken = env('LAZADA_ACCESS_TOKEN');
    //     $appKey = env('LAZADA_APP_KEY');
    //     $appSecret = env('LAZADA_APP_SECRET');
    //     $apiUrl = 'https://api.lazada.co.th/rest';
    //     $apiPath = '/im/message/send';

    //     $params = [
    //         'session_id'   => $sessionId,
    //         'template_id'  => 1,
    //         'img_url'      => $imageUrl,
    //         'app_key'      => $appKey,
    //         'sign_method'  => 'sha256',
    //         'timestamp'    => round(microtime(true) * 1000),
    //         'access_token' => $accessToken,
    //     ];

    //     ksort($params);
    //     $stringToSign = $apiPath;
    //     foreach ($params as $key => $value) {
    //         $stringToSign .= $key . $value;
    //     }
    //     $params['sign'] = strtoupper(hash_hmac('sha256', $stringToSign, $appSecret));

    //     try {
    //         $response = Http::asForm()->post($apiUrl . $apiPath, $params);
    //         Log::info('✅ Lazada image message sent successfully', ['response' => $response->json()]);
    //     } catch (\Exception $e) {
    //         Log::error('❌ Failed to send image message', ['error' => $e->getMessage()]);
    //     }
    // }

    public function sendMessage(string $custId, array $message): array
    {
        try {
            switch ($message['contentType']) {
                case 'text':
                    $this->sendReply($custId, $message['content']);
                    break;

                case 'image':
                    if (filter_var($message['content'], FILTER_VALIDATE_URL)) {
                        $imageData = file_get_contents($message['content']);
                        $tmpFile = tempnam(sys_get_temp_dir(), 'img_');
                        file_put_contents($tmpFile, $imageData);
                        $this->sendImage($custId, $tmpFile);
                        unlink($tmpFile); 
                    } else {
                        $this->sendImage($custId, $message['content']);
                    }
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
