<?php

namespace App\Services\webhooks;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class LazadaMessageService
{
    /**
     * Main function to dispatch messages based on type.
     * @param string $custId
     * @param array $message
     * @return array
     */
    public function sendMessage(string $custId, array $message): array
    {
        try {
            switch ($message['contentType']) {
                case 'text':
                    self::sendReply($custId, $message['content']);
                    break;
                case 'image':
                    self::sendImage($custId, $message['content']);
                    break;
                case 'video':
                    $this->sendVideoWithFallback($custId, $message['content']);
                    break;
                default:
                    throw new \Exception("Unsupported contentType: " . $message['contentType']);
            }
            return ['status' => true, 'message' => 'ส่งข้อความสำเร็จ'];
        } catch (\Exception $e) {
            Log::channel('lazada_webhook_log')->error('Lazada sendMessage failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return ['status' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Enhanced video sending with fallback mechanism
     * @param string $custId
     * @param string $videoPath
     */
    private function sendVideoWithFallback(string $custId, string $videoPath): void
    {
        Log::channel('lazada_webhook_log')->info("📹 Attempting video upload with fallback", ['path' => $videoPath]);
        
        try {
            self::sendVideo($custId, $videoPath);
        } catch (\Exception $e) {
            Log::channel('lazada_webhook_log')->warning("📹 Video upload failed, using fallback method", [
                'error' => $e->getMessage()
            ]);
            $publicVideoUrl = $this->convertPathToPublicUrl($videoPath);
            
            $fallbackMessage = "🎥 วิดีโอที่ส่งมา: " . $publicVideoUrl . "\n\nขออภัยที่ไม่สามารถส่งวิดีโอโดยตรงได้ กรุณาคลิกลิงก์เพื่อดูวิดีโอค่ะ";
            self::sendReply($custId, $fallbackMessage);
            
            Log::channel('lazada_webhook_log')->info("✅ Video fallback message sent successfully");
        }
    }

    /**
     * Convert local storage path to public URL
     * @param string $localPath
     * @return string
     */
    private function convertPathToPublicUrl(string $localPath): string
    {
        $relativePath = str_replace(storage_path('app/'), '', $localPath);
        $relativePath = str_replace('public/', '', $relativePath);
        
        $baseUrl = rtrim(config('app.url', 'http://localhost'), '/');
        return $baseUrl . '/storage/' . $relativePath;
    }

    /**
     * Send a text reply message.
     * @param string $sessionId
     * @param string $replyText
     */
    public static function sendReply(string $sessionId, string $replyText): void
    {
        $apiPath = '/im/message/send';
        $params = ['session_id' => $sessionId, 'template_id' => 1, 'txt' => $replyText];
        self::executePostRequest($apiPath, $params);
    }
    
    /**
     * Send an image using a public URL.
     * @param string $sessionId
     * @param string $imageUrl
     */
    public static function sendImage(string $sessionId, string $imageUrl): void
    {
        Log::channel('lazada_webhook_log')->info("📷 Sending image message with URL:", ['url' => $imageUrl]);
        $apiPath = '/im/message/send';
        $params = [
            'session_id'   => $sessionId,
            'template_id'  => 3,
            'img_url'      => $imageUrl,
            'width'        => 600, 
            'height'       => 600,
        ];
        self::executePostRequest($apiPath, $params);
    }

    /**
     * Send a video by uploading it first, then sending the message.
     * @param string $sessionId
     * @param string $videoPath Absolute local path to the video file.
     * @throws \Exception if upload fails
     */
    public static function sendVideo(string $sessionId, string $videoPath): void
    {
        Log::channel('lazada_webhook_log')->info("📹 Starting video send process", ['path' => $videoPath]);
        
        if (!file_exists($videoPath)) {
            throw new \Exception("Video file does not exist at path: " . $videoPath);
        }

        if (self::shouldSkipVideoUpload()) {
            throw new \Exception("Video upload temporarily disabled due to permission issues");
        }

        try {
            $videoId = self::uploadVideo($videoPath);
            
            if (!$videoId) {
                self::markVideoUploadAsProblematic();
                throw new \Exception("Failed to upload video to Lazada. Check logs for details (e.g., 'InsufficientPermission').");
            }

            self::sendVideoMessage($sessionId, $videoId);

            Log::channel('lazada_webhook_log')->info("✅ Video sent successfully", [
                'video_id' => $videoId, 'session_id' => $sessionId
            ]);

        } catch (\Exception $e) {
            Log::channel('lazada_webhook_log')->error('❌ Error during sendVideo process', [
                'error' => $e->getMessage(), 'path' => $videoPath
            ]);
            throw $e; 
        }
    }

    private static function shouldSkipVideoUpload(): bool
    {
        $cacheKey = 'lazada_video_upload_disabled';
        return cache()->has($cacheKey);
    }

    private static function markVideoUploadAsProblematic(): void
    {
        $cacheKey = 'lazada_video_upload_disabled';
        cache()->put($cacheKey, true, now()->addHour());
        
        Log::channel('lazada_webhook_log')->warning("📹 Video upload disabled temporarily due to repeated failures");
    }

    private static function uploadVideo(string $videoPath): ?string
    {
        $videoId = self::tryDirectVideoUpload($videoPath);
        if ($videoId) {
            return $videoId;
        }
        
        $videoId = self::tryGeneralMediaUpload($videoPath);
        if ($videoId) {
            return $videoId;
        }
        
        Log::channel('lazada_webhook_log')->error('❌ All video upload approaches failed');
        return null;
    }
    
    private static function tryDirectVideoUpload(string $videoPath): ?string
    {
        $apiPath = '/media/video/block/upload';
        $signedParams = self::buildAndSignRequest($apiPath, []);

        try {
            $response = Http::attach(
                'video', file_get_contents($videoPath), basename($videoPath)
            )->post(env('LAZADA_API_URL', 'https://api.lazada.co.th/rest') . $apiPath, $signedParams);

            $jsonResponse = $response->json();

            if ($response->successful() && isset($jsonResponse['code']) && $jsonResponse['code'] == '0') {
                $videoId = $jsonResponse['data']['video_id'] ?? null;
                Log::channel('lazada_webhook_log')->info('✅ Direct video upload successful', [
                    'video_id' => $videoId
                ]);
                return $videoId;
            } else {
                Log::channel('lazada_webhook_log')->warning('❌ Direct video upload failed', ['response' => $jsonResponse]);
                return null;
            }
        } catch (\Exception $e) {
            Log::channel('lazada_webhook_log')->warning('❌ Direct video upload exception', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
    
    private static function tryGeneralMediaUpload(string $videoPath): ?string
    {
        $apiPath = '/media/upload';
        $signedParams = self::buildAndSignRequest($apiPath, []);

        try {
            $response = Http::attach(
                'file', file_get_contents($videoPath), basename($videoPath)
            )->post(env('LAZADA_API_URL', 'https://api.lazada.co.th/rest') . $apiPath, $signedParams);

            $jsonResponse = $response->json();

            if ($response->successful() && isset($jsonResponse['code']) && $jsonResponse['code'] == '0') {
                $mediaId = $jsonResponse['data']['media_id'] ?? $jsonResponse['data']['video_id'] ?? null;
                Log::channel('lazada_webhook_log')->info('✅ General media upload successful', [
                    'media_id' => $mediaId
                ]);
                return $mediaId;
            } else {
                Log::channel('lazada_webhook_log')->warning('❌ General media upload failed', ['response' => $jsonResponse]);
                return null;
            }
        } catch (\Exception $e) {
            Log::channel('lazada_webhook_log')->warning('❌ General media upload exception', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Sends a video message payload using a video_id.
     * @param string $sessionId
     * @param string $videoId
     */
    private static function sendVideoMessage(string $sessionId, string $videoId): void
    {
        $apiPath = '/im/message/send';
        $params = ['session_id' => $sessionId, 'template_id' => 6, 'video_id' => $videoId];
        self::executePostRequest($apiPath, $params);
    }

    /**
     * A centralized method to build request parameters and signature.
     * @param string $apiPath
     * @param array $customParams
     * @return array
     */
    private static function buildAndSignRequest(string $apiPath, array $customParams): array
    {
        $commonParams = [
            'app_key'      => env('LAZADA_APP_KEY'),
            'sign_method'  => 'sha256',
            'timestamp'    => round(microtime(true) * 1000),
            'access_token' => env('LAZADA_ACCESS_TOKEN'),
        ];

        $params = array_merge($commonParams, $customParams);
        ksort($params);

        $stringToSign = $apiPath;
        foreach ($params as $key => $value) {
            if (is_string($value) || is_numeric($value)) {
                $stringToSign .= $key . $value;
            }
        }
        
        $params['sign'] = strtoupper(hash_hmac('sha256', $stringToSign, env('LAZADA_APP_SECRET')));
        return $params;
    }

    /**
     * A centralized method to execute POST requests to Lazada API.
     * @param string $apiPath
     * @param array $params
     */
    private static function executePostRequest(string $apiPath, array $params): void
    {
        $signedParams = self::buildAndSignRequest($apiPath, $params);
        $apiUrl = env('LAZADA_API_URL', 'https://api.lazada.co.th/rest');

        try {
            $response = Http::asForm()->post($apiUrl . $apiPath, $signedParams);
            $jsonResponse = $response->json();

            if ($response->successful() && isset($jsonResponse['code']) && $jsonResponse['code'] == '0') {
                Log::channel('lazada_webhook_log')->info("✅ API call successful for path: {$apiPath}", ['response' => $jsonResponse]);
            } else {
                Log::channel('lazada_webhook_log')->error("❌ API call failed for path: {$apiPath}", ['response' => $jsonResponse]);
            }
        } catch (\Exception $e) {
            Log::channel('lazada_webhook_log')->error("❌ Exception on API call for path: {$apiPath}", ['error' => $e->getMessage()]);
            // Re-throw the exception to let the caller handle it
            throw $e;
        }
    }

    /**
     * Get customer info from Lazada.
     * @param string $sessionId
     * @return string
     */
    public static function getCustomerInfo(string $sessionId): string
    {
        $apiPath = '/im/session/get';
        $params = ['session_id' => $sessionId];
        $signedParams = self::buildAndSignRequest($apiPath, $params);
        $apiUrl = env('LAZADA_API_URL', 'https://api.lazada.co.th/rest');

        try {
            $response = Http::get($apiUrl . $apiPath, $signedParams);
            $jsonResponse = $response->json();
            
            if ($response->successful() && isset($jsonResponse['code']) && $jsonResponse['code'] == '0') {
                $customerName = $jsonResponse['data']['buyer_nick'] ?? 'ลูกค้า';
                Log::channel('lazada_webhook_log')->info('✅ Successfully fetched customer info', ['name' => $customerName]);
                return $customerName;
            } else {
                 Log::channel('lazada_webhook_log')->error("❌ API call failed for path: {$apiPath}", ['response' => $jsonResponse]);
                 return 'ลูกค้า';
            }

        } catch (\Exception $e) {
            Log::channel('lazada_webhook_log')->error('❌ Failed to get customer info', ['error' => $e->getMessage()]);
            return 'ลูกค้า';
        }
    }

    /**
     * Store media from a URL (e.g., from a customer webhook).
     * @param ?string $mediaUrl
     * @return string
     */
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
            $relativePath = 'lazada-media/' . uniqid('lzd_', true) . $extension;
            Storage::disk('public')->put($relativePath, $mediaContent);
            
            $baseUrl = rtrim(config('app.url', 'http://localhost'), '/');
            $publicUrl = $baseUrl . '/storage/' . $relativePath;

            Log::channel('lazada_webhook_log')->info("✅ Stored incoming Lazada media successfully: {$publicUrl}");
            return $publicUrl;
        } catch (\Exception $e) {
            Log::channel('lazada_webhook_log')->error('Error in storeMedia: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return 'ไม่สามารถบันทึกไฟล์มีเดียได้';
        }
    }
}