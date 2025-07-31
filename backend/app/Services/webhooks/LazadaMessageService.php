<?php

namespace App\Services\webhooks;

use Exception;
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
                    $this->sendVideo($custId, $message['content']);
                    break;
                default:
                    throw new Exception("Unsupported contentType: " . $message['contentType']);
            }
            return ['status' => true, 'message' => 'ส่งข้อความสำเร็จ'];
        } catch (Exception $e) {
            Log::channel('lazada_webhook_log')->error('Lazada sendMessage failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return ['status' => false, 'message' => $e->getMessage()];
        }
    }

    public function sendVideo(string $custId, string $videoPath, bool $sendAsLink = false): void
    {
        try {
            if ($sendAsLink) {
                Log::channel('lazada_webhook_log')->info("📹 Sending video as clickable link (forced)...", ['path' => $videoPath]);

                $publicVideoUrl = $this->convertPathToPublicUrl($videoPath);
                $videoMessage = "🎥 วีดีโอจากเจ้าหน้าที่ กรุณาคลิกลิงก์เพื่อรับชม: " . $publicVideoUrl;

                $apiPath = '/im/message/send';
                $params = ['session_id' => $custId, 'template_id' => 1, 'txt' => $videoMessage];
                $signedParams = self::buildAndSignRequest($apiPath, $params);
                $apiUrl = env('LAZADA_API_URL', 'https://api.lazada.co.th/rest');

                $response = Http::asForm()->post($apiUrl . $apiPath, $signedParams);
                $jsonResponse = $response->json();

                $isSuccess = $response->successful() &&
                    isset($jsonResponse['code']) &&
                    $jsonResponse['code'] == '0' &&
                    !isset($jsonResponse['data']['process_msg']) &&
                    (!isset($jsonResponse['data']['status']) || $jsonResponse['data']['status'] != 0);

                if ($isSuccess) {
                    Log::channel('lazada_webhook_log')->info("✅ Video link sent successfully.", ['video_url' => $publicVideoUrl]);
                } else {
                    $notificationMessage = "📹 ขออภัยค่ะ เจ้าหน้าที่ไม่สามารถส่งวีดีโอผ่านระบบแชทได้ในขณะนี้ " .
                        "หากต้องการดูวีดีโอ กรุณาติดต่อเจ้าหน้าที่โดยตรงผ่านช่องทางอื่น " .
                        "หรือแจ้งเบอร์โทรศัพท์เพื่อให้เจ้าหน้าที่ติดต่อกลับค่ะ 🙏";

                    self::sendReply($custId, $notificationMessage);
                    Log::channel('lazada_webhook_log')->warning("📹 Video link blocked by Lazada, sent notification instead.");
                }
                return;
            }

            Log::channel('lazada_webhook_log')->info("📹 Attempting to send video directly...", ['path' => $videoPath]);

            $videoId = self::uploadVideoToLazada($videoPath);

            $apiPath = '/im/message/send';
            $params = ['session_id' => $custId, 'template_id' => 6, 'video_id' => $videoId];
            $signedParams = self::buildAndSignRequest($apiPath, $params);
            $apiUrl = env('LAZADA_API_URL', 'https://api.lazada.co.th/rest');

            $response = Http::asForm()->post($apiUrl . $apiPath, $signedParams);
            $jsonResponse = $response->json();

            $isSuccess = $response->successful() &&
                isset($jsonResponse['code']) &&
                $jsonResponse['code'] == '0' &&
                !isset($jsonResponse['data']['process_msg']) &&
                (!isset($jsonResponse['data']['status']) || $jsonResponse['data']['status'] != 0);

            if ($isSuccess) {
                Log::channel('lazada_webhook_log')->info("✅ Video sent successfully as direct video message.", ['video_id' => $videoId]);
            } else {
                throw new Exception("Video send failed: " . ($jsonResponse['data']['process_msg'] ?? 'Unknown error'));
            }
        } catch (Exception $e) {
            Log::channel('lazada_webhook_log')->warning("📹 Video send failed, sending notification to customer.", [
                'error' => $e->getMessage(),
                'path' => $videoPath
            ]);

            $notificationMessage = "📹 ขออภัยค่ะ เจ้าหน้าที่ไม่สามารถส่งวีดีโอผ่านระบบแชทได้ในขณะนี้ " .
                "หากต้องการดูวีดีโอ กรุณาติดต่อเจ้าหน้าที่โดยตรงผ่านช่องทางอื่น " .
                "หรือแจ้งเบอร์โทรศัพท์เพื่อให้เจ้าหน้าที่ติดต่อกลับค่ะ 🙏";

            try {
                self::sendReply($custId, $notificationMessage);
                Log::channel('lazada_webhook_log')->info("✅ Video failure notification sent successfully.");
            } catch (Exception $notificationError) {
                Log::channel('lazada_webhook_log')->error("❌ Failed to send video failure notification.", [
                    'error' => $notificationError->getMessage()
                ]);
            }
        }
    }

    private static function uploadVideoToLazada(string $videoPath): string
    {
        if (!file_exists($videoPath)) {
            throw new Exception("Video file does not exist at path: " . $videoPath);
        }

        $videoId = self::tryDirectVideoUpload($videoPath);
        if ($videoId) {
            return $videoId;
        }

        $videoId = self::tryGeneralMediaUpload($videoPath);
        if ($videoId) {
            return $videoId;
        }

        throw new Exception("All video upload attempts to Lazada failed.");
    }

    private function convertPathToPublicUrl(string $localPath): string
    {
        $relativePath = str_replace(storage_path('app/'), '', $localPath);
        $relativePath = str_replace('public/', '', $relativePath);
        $baseUrl = rtrim(config('app.webhook_url', config('app.url')), '/');
        return $baseUrl . '/storage/' . $relativePath;
    }

    public static function sendReply(string $sessionId, string $replyText): void
    {
        $apiPath = '/im/message/send';
        $params = ['session_id' => $sessionId, 'template_id' => 1, 'txt' => $replyText];
        self::executePostRequest($apiPath, $params);
    }

    public static function sendImage(string $sessionId, string $imageUrl): void
    {
        $apiPath = '/im/message/send';
        $params = [
            'session_id'  => $sessionId,
            'template_id' => 3,
            'img_url'     => $imageUrl,
            'width'       => 600,
            'height'      => 600,
        ];
        self::executePostRequest($apiPath, $params);
    }

    private static function sendVideoMessage(string $sessionId, string $videoId): void
    {
        $apiPath = '/im/message/send';
        $params = ['session_id' => $sessionId, 'template_id' => 6, 'video_id' => $videoId];
        self::executePostRequest($apiPath, $params);
    }

    private static function tryDirectVideoUpload(string $videoPath): ?string
    {
        $apiPath = '/media/video/block/upload';
        $signedParams = self::buildAndSignRequest($apiPath, []);

        try {
            $response = Http::attach('video', file_get_contents($videoPath), basename($videoPath))
                ->post(env('LAZADA_API_URL', 'https://api.lazada.co.th/rest') . $apiPath, $signedParams);

            $jsonResponse = $response->json();
            if ($response->successful() && isset($jsonResponse['code']) && $jsonResponse['code'] == '0') {
                return $jsonResponse['data']['video_id'] ?? null;
            }
            Log::channel('lazada_webhook_log')->warning('❌ Direct video upload failed', ['response' => $jsonResponse]);
            return null;
        } catch (Exception $e) {
            Log::channel('lazada_webhook_log')->warning('❌ Direct video upload exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    private static function tryGeneralMediaUpload(string $videoPath): ?string
    {
        $apiPath = '/media/upload';
        $signedParams = self::buildAndSignRequest($apiPath, []);

        try {
            $response = Http::attach('file', file_get_contents($videoPath), basename($videoPath))
                ->post(env('LAZADA_API_URL', 'https://api.lazada.co.th/rest') . $apiPath, $signedParams);

            $jsonResponse = $response->json();
            if ($response->successful() && isset($jsonResponse['code']) && $jsonResponse['code'] == '0') {
                return $jsonResponse['data']['media_id'] ?? $jsonResponse['data']['video_id'] ?? null;
            }
            Log::channel('lazada_webhook_log')->warning('❌ General media upload failed', ['response' => $jsonResponse]);
            return null;
        } catch (Exception $e) {
            Log::channel('lazada_webhook_log')->warning('❌ General media upload exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

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
                throw new Exception("Lazada API call failed for path: " . $apiPath);
            }
        } catch (Exception $e) {
            Log::channel('lazada_webhook_log')->error("❌ Exception on API call for path: {$apiPath}", ['error' => $e->getMessage()]);
            throw $e;
        }
    }

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
                return $jsonResponse['data']['buyer_nick'] ?? 'ลูกค้า';
            }
            return 'ลูกค้า';
        } catch (Exception $e) {
            Log::channel('lazada_webhook_log')->error('❌ Failed to get customer info', ['error' => $e->getMessage()]);
            return 'ลูกค้า';
        }
    }

    public static function storeMedia(?string $mediaUrl): string
    {
        if (!$mediaUrl) {
            return '[ไม่พบ URL ของมีเดีย]';
        }

        try {
            $response = Http::timeout(30)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                ])
                ->get($mediaUrl);

            if ($response->failed()) {
                throw new Exception("Failed to download media from URL: " . $mediaUrl);
            }

            $contentType = $response->header('Content-Type');
            $mediaContent = $response->body();

            $extension = self::determineFileExtension($contentType, $mediaContent);

            $relativePath = 'lazada-media/' . uniqid('lzd_', true) . $extension;
            Storage::disk('public')->put($relativePath, $mediaContent);

            $baseUrl = rtrim(config('app.webhook_url', config('app.url')), '/');
            $publicUrl = $baseUrl . '/storage/' . $relativePath;

            Log::channel('lazada_webhook_log')->info("✅ Stored incoming Lazada media successfully", [
                'url' => $publicUrl,
                'content_type' => $contentType,
                'file_size' => strlen($mediaContent),
                'extension' => $extension
            ]);

            return $publicUrl;
        } catch (Exception $e) {
            Log::channel('lazada_webhook_log')->error('Error in storeMedia: ' . $e->getMessage(), [
                'media_url' => $mediaUrl
            ]);
            return 'ไม่สามารถบันทึกไฟล์มีเดียได้';
        }
    }

    private static function determineFileExtension(?string $contentType, string $content): string
    {
        $extensionFromContentType = match ($contentType) {
            'image/jpeg' => '.jpg',
            'image/png' => '.png',
            'image/gif' => '.gif',
            'image/webp' => '.webp',
            'video/mp4' => '.mp4',
            'video/webm' => '.webm',
            'video/ogg' => '.ogg',
            'video/avi' => '.avi',
            'video/mov' => '.mov',
            'video/quicktime' => '.mov',
            default => null,
        };

        if ($extensionFromContentType) {
            return $extensionFromContentType;
        }

        $magicBytes = substr($content, 0, 20);

        if (
            str_starts_with($magicBytes, "\x00\x00\x00\x18ftypmp4") ||
            str_starts_with($magicBytes, "\x00\x00\x00\x20ftypmp41")
        ) {
            return '.mp4';
        }

        if (str_starts_with($magicBytes, "RIFF") && str_contains($magicBytes, "AVI")) {
            return '.avi';
        }

        if (str_starts_with($magicBytes, "\x1A\x45\xDF\xA3")) {
            return '.webm';
        }

        // Image magic bytes
        if (str_starts_with($magicBytes, "\xFF\xD8\xFF")) {
            return '.jpg';
        }

        if (str_starts_with($magicBytes, "\x89PNG\r\n\x1a\n")) {
            return '.png';
        }

        if (str_starts_with($magicBytes, "GIF87a") || str_starts_with($magicBytes, "GIF89a")) {
            return '.gif';
        }

        if (str_starts_with($magicBytes, "RIFF") && str_contains($magicBytes, "WEBP")) {
            return '.webp';
        }

        // Default fallback
        return '.jpg';
    }
}
