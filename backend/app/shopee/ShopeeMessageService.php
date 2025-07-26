<?php

namespace App\shopee;

use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ShopeeMessageService
{
    /**
     * กำหนดค่า options สำหรับ json_encode ไว้ใช้ซ้ำ
     */
    private const JSON_LOG_OPTIONS = JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;

    /**
     * ส่งข้อความไปยังลูกค้า Shopee
     *
     * @param string $custId คือ to_id ของลูกค้า Shopee
     * @param array $message ข้อมูลข้อความที่ต้องการส่ง ['contentType' => 'text'|'image'|'video', 'content' => '...']
     * @return array ผลลัพธ์การส่ง ['status' => bool, 'message' => string, 'final_content' => string]
     */
    public function sendMessage(string $custId, array $message): array
    {
        try {
            // ดึงข้อมูลลูกค้าและ token
            $customer = Customers::where('custId', $custId)->firstOrFail();
            $token = PlatformAccessTokens::findOrFail($customer->platformRef);

            // *** เพิ่ม Log รูปแบบใหม่ตรงนี้ ***
            // สร้าง message array สำหรับ log โดยไม่รวม object UploadedFile
            $logMessage = $message;
            if (isset($logMessage['content']) && $logMessage['content'] instanceof UploadedFile) {
                $logMessage['content'] = '[UploadedFile: ' . $logMessage['content']->getClientOriginalName() . ']';
            }

            Log::channel('shopee_message_log')->info('เริ่มส่งข้อความไปยังลูกค้า', [
                'customer' => $customer->toJson(self::JSON_LOG_OPTIONS),
                'message' => json_encode($logMessage, self::JSON_LOG_OPTIONS),
                'platformAccessToken' => $token->toJson(self::JSON_LOG_OPTIONS),
            ]);


            // สร้าง chat service
            $chatService = new ShopeeChatService(
                $token->shopee_partner_id,
                $token->shopee_partner_key,
                $token->shopee_shop_id,
                $token->accessToken
            );

            $finalContent = $message['content'];
            $contentPayload = null; // กำหนดค่าเริ่มต้น

            switch ($message['contentType']) {
                case 'text':
                    $contentPayload = ['text' => $message['content']];
                    $result = $chatService->sendMessage((int)$custId, 'text', $contentPayload);
                    break;
                case 'image':
                    if (!$message['content'] instanceof UploadedFile) {
                        throw new \Exception('Invalid file format for image message. Expected UploadedFile.');
                    }
                    Log::channel('shopee_cron_job_log')->info('Starting image upload to Shopee', [
                        'custId' => $custId,
                        'fileName' => $message['content']->getClientOriginalName(),
                        'fileSize' => $message['content']->getSize(),
                        'mimeType' => $message['content']->getMimeType()
                    ]);
                    $uploadResult = $chatService->uploadImage($message['content']);
                    Log::channel('shopee_cron_job_log')->info('Image upload result', [
                        'success' => $uploadResult['success'],
                        'data' => $uploadResult['data'] ?? null,
                        'message' => $uploadResult['message'] ?? null,
                        'details' => $uploadResult['details'] ?? null
                    ]);

                    if (!$uploadResult['success']) {
                        $errorMessage = 'Failed to upload image to Shopee.';
                        Log::channel('shopee_cron_job_log')->error($errorMessage, [
                            'uploadResult' => $uploadResult,
                            'details' => $uploadResult['details'] ?? 'No details provided from API'
                        ]);
                        throw new \Exception($errorMessage . ' Details: ' . json_encode($uploadResult['details'] ?? 'N/A'));
                    }

                    $shopeeImageUrl = $uploadResult['data']['url']
                        ?? $uploadResult['data']['image_url']
                        ?? $uploadResult['data']['image_info']['url']
                        ?? null;

                    if (empty($shopeeImageUrl)) {
                        $errorMessage = 'No image URL found in upload response';
                        Log::channel('shopee_cron_job_log')->error($errorMessage, [
                            'uploadResult' => $uploadResult
                        ]);
                        throw new \Exception($errorMessage . '. Upload response: ' . json_encode($uploadResult['data'] ?? []));
                    }

                    $finalContent = $shopeeImageUrl;
                    Log::channel('shopee_cron_job_log')->info('Sending image message to Shopee', [
                        'custId' => $custId,
                        'imageUrl' => $shopeeImageUrl
                    ]);
                    
                    // ลองส่งหลาย format เพื่อความเข้ากันได้
                    $contentPayload = ['url' => $shopeeImageUrl];
                    $result = $chatService->sendMessage((int)$custId, 'image', $contentPayload);
                    if (!$result['success']) {
                        Log::channel('shopee_cron_job_log')->info('First format failed, trying alternative format');
                        $contentPayload = ['image_url' => $shopeeImageUrl];
                        $result = $chatService->sendMessage((int)$custId, 'image', $contentPayload);
                    }
                    if (!$result['success']) {
                        Log::channel('shopee_cron_job_log')->info('Second format failed, trying third format');
                        $contentPayload = [
                            'image_info' => [
                                'url' => $shopeeImageUrl
                            ]
                        ];
                        $result = $chatService->sendMessage((int)$custId, 'image', $contentPayload);
                    }
                    break;
                case 'video':
                    if (!$message['content'] instanceof UploadedFile) {
                        throw new \Exception('Invalid file format for video message. Expected UploadedFile.');
                    }

                    // 1. บันทึกไฟล์วิดีโอที่อัปโหลดลง Local Storage ก่อน และรับ URL กลับมา
                    $finalContent = $this->storeUploadedVideoLocally($message['content']);
                    if (!$finalContent) {
                        throw new \Exception('Failed to store uploaded video locally.');
                    }

                    // 2. อัปโหลดไฟล์ไปยัง Shopee
                    $uploadResult = $chatService->uploadVideo($message['content']);
                    if (!$uploadResult['success']) {
                        throw new \Exception('Failed to upload video to Shopee. Details: ' . json_encode($uploadResult['details'] ?? 'N/A'));
                    }
                    $videoData = $uploadResult['data'] ?? [];
                    $videoId = $videoData['vid'] ?? $videoData['video_id'] ?? null;

                    if (empty($videoId)) {
                        throw new \Exception('No video ID found in upload response. Response: ' . json_encode($videoData));
                    }

                    // 3. รอ video processing จาก Shopee
                    $processingResult = $this->waitForVideoProcessing($chatService, $videoId);
                    if (!$processingResult['success']) {
                        throw new \Exception($processingResult['message']);
                    }

                    // 4. ส่งข้อความวิดีโอโดยใช้ข้อมูลจาก Shopee
                    $videoInfo = $processingResult['videoInfo'] ?? [];
                    $result = $this->tryVideoMessageFormats($chatService, (int)$custId, $videoId, $videoInfo);
                    $contentPayload = $result['sent_payload'] ?? null; // เก็บ payload ที่ส่งสำเร็จไว้ log
                    break;
                default:
                    throw new \Exception("Unsupported Shopee message contentType: " . $message['contentType']);
            }

            // ตรวจสอบผลลัพธ์การส่งข้อความ
            if (!$result['success']) {
                Log::channel('shopee_cron_job_log')->error('Failed to send message via Shopee API.', [
                    'custId' => $custId,
                    'messageType' => $message['contentType'],
                    'contentPayload' => $contentPayload,
                    'result' => $result,
                    'details' => $result['details'] ?? 'No details provided'
                ]);
                throw new \Exception($result['message'] ?? 'Failed to send message to Shopee API');
            }

            Log::channel('shopee_cron_job_log')->info('Message sent successfully to Shopee', [
                'custId' => $custId,
                'messageType' => $message['contentType'],
                'finalContent' => $finalContent
            ]);

            return [
                'status' => true,
                'message' => 'ส่งข้อความสำเร็จ',
                'final_content' => $finalContent,
                'responseJson' => $result['data'] ?? [],
            ];
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            $errorMessage = 'Customer or Platform token not found: ' . $e->getMessage();
            Log::channel('shopee_cron_job_log')->error($errorMessage, [
                'custId' => $custId,
                'trace' => $e->getTraceAsString()
            ]);
            return [
                'status' => false,
                'message' => $errorMessage,
                'final_content' => null,
            ];
        } catch (\Exception $e) {
            Log::channel('shopee_cron_job_log')->error('Shopee sendMessage failed: ' . $e->getMessage(), [
                'custId' => $custId,
                'message' => $message,
                'trace' => $e->getTraceAsString()
            ]);
            return [
                'status' => false,
                'message' => $e->getMessage(),
                'final_content' => null,
            ];
        }
    }
    
    // ... ส่วนที่เหลือของโค้ดยังคงเหมือนเดิม ...
    private function storeUploadedVideoLocally(UploadedFile $videoFile): ?string
    {
        try {
            $originalName = $videoFile->getClientOriginalName();
            $fileName = pathinfo($originalName, PATHINFO_FILENAME) . '_' . time() . '.' . $videoFile->getClientOriginalExtension();
            $storagePath = 'shopee-videos/' . $fileName;

            // บันทึกไฟล์ลง public storage
            $stored = Storage::disk('public')->put($storagePath, $videoFile->get());

            if (!$stored) {
                Log::channel('shopee_cron_job_log')->error("Failed to store outgoing video file", [
                    'fileName' => $fileName,
                    'storagePath' => $storagePath
                ]);
                return null;
            }

            // สร้าง public URL
            $baseUrl = config('app.url', 'http://localhost:8000');
            $publicUrl = $baseUrl . '/storage/' . $storagePath;

            Log::channel('shopee_cron_job_log')->info("Successfully stored outgoing video", [
                'fileName' => $fileName,
                'storagePath' => $storagePath,
                'publicUrl' => $publicUrl
            ]);

            return $publicUrl;
        } catch (\Exception $e) {
            Log::channel('shopee_cron_job_log')->error("Exception while storing outgoing video", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }

    private function waitForVideoProcessing($chatService, string $videoId): array
    {
        $videoReady = false;
        $maxRetries = 10;
        $retryDelay = 3;
        $videoInfo = null;

        Log::channel('shopee_cron_job_log')->info("Polling for video status...", ['vid' => $videoId]);

        for ($i = 0; $i < $maxRetries; $i++) {
            $statusResult = $chatService->getVideoUploadResult($videoId);

            Log::channel('shopee_cron_job_log')->info("Video status check", [
                'vid' => $videoId,
                'attempt' => $i + 1,
                'statusResult' => $statusResult
            ]);

            if ($statusResult['success'] && isset($statusResult['data']['status'])) {
                $status = $statusResult['data']['status'];
                $videoInfo = $statusResult['data'];

                if ($status === 'successful' || $status === 'success') {
                    $videoReady = true;
                    Log::channel('shopee_cron_job_log')->info("Video is ready!", [
                        'vid' => $videoId,
                        'videoInfo' => $videoInfo
                    ]);
                    break;
                } elseif ($status === 'failed' || $status === 'error') {
                    Log::channel('shopee_cron_job_log')->error("Video processing failed", [
                        'vid' => $videoId,
                        'videoInfo' => $videoInfo
                    ]);
                    return [
                        'success' => false,
                        'message' => "Video processing failed with status: {$status}"
                    ];
                }
            }

            Log::channel('shopee_cron_job_log')->info("Video not ready yet, retrying...", [
                'vid' => $videoId,
                'attempt' => $i + 1,
                'response' => $statusResult['data'] ?? 'N/A'
            ]);

            sleep($retryDelay);
        }

        if (!$videoReady) {
            return [
                'success' => false,
                'message' => "Video processing timed out after {$maxRetries} retries."
            ];
        }

        return [
            'success' => true,
            'videoInfo' => $videoInfo
        ];
    }

    private function tryVideoMessageFormats($chatService, int $custId, string $videoId, array $videoInfo): array
    {
        $durationSeconds = isset($videoInfo['duration']) ?
            ($videoInfo['duration'] > 1000 ? round($videoInfo['duration'] / 1000) : $videoInfo['duration']) : 0;

        $formats = [
            [
                'vid' => $videoId,
                'video_url' => $videoInfo['video'] ?? null,
                'thumb_url' => $videoInfo['thumbnail'] ?? null,
                'thumb_width' => $videoInfo['width'] ?? 0,
                'thumb_height' => $videoInfo['height'] ?? 0,
                'duration_seconds' => $durationSeconds
            ],
            [
                'video_id' => $videoId,
                'video_url' => $videoInfo['video'] ?? null,
                'thumb_url' => $videoInfo['thumbnail'] ?? null,
                'thumb_width' => $videoInfo['width'] ?? 0,
                'thumb_height' => $videoInfo['height'] ?? 0,
                'duration_seconds' => $durationSeconds
            ],
            [
                'vid' => $videoId,
                'video_url' => $videoInfo['video'] ?? null,
                'duration_seconds' => $durationSeconds
            ],
            [
                'vid' => $videoId,
                'thumb_url' => $videoInfo['thumbnail'] ?? null,
                'thumb_width' => $videoInfo['width'] ?? 0,
                'thumb_height' => $videoInfo['height'] ?? 0,
                'duration_seconds' => $durationSeconds
            ],
            [
                'vid' => $videoId,
                'duration_seconds' => $durationSeconds
            ],
            [
                'vid' => $videoId
            ]
        ];
        
        $lastResult = [];

        foreach ($formats as $index => $contentPayload) {
            $contentPayload = array_filter($contentPayload, function ($value, $key) {
                if (in_array($key, ['vid', 'video_id', 'duration_seconds'])) {
                    return $value !== null && $value !== '';
                }
                return $value !== null && $value !== '' && $value !== 0;
            }, ARRAY_FILTER_USE_BOTH);

            Log::channel('shopee_cron_job_log')->info("Trying video format " . ($index + 1), [
                'custId' => $custId,
                'videoId' => $videoId,
                'contentPayload' => $contentPayload
            ]);

            $result = $chatService->sendMessage($custId, 'video', $contentPayload);
            $result['sent_payload'] = $contentPayload; // เพิ่ม payload เข้าไปในผลลัพธ์
            $lastResult = $result;

            if ($result['success']) {
                Log::channel('shopee_cron_job_log')->info("Video message sent successfully with format " . ($index + 1), [
                    'custId' => $custId,
                    'videoId' => $videoId,
                    'contentPayload' => $contentPayload
                ]);
                return $lastResult;
            } else {
                Log::channel('shopee_cron_job_log')->info("Video format " . ($index + 1) . " failed", [
                    'custId' => $custId,
                    'videoId' => $videoId,
                    'contentPayload' => $contentPayload,
                    'error' => $result['details'] ?? $result['message'] ?? 'Unknown error'
                ]);
            }
        }

        Log::channel('shopee_cron_job_log')->error("All video message formats failed", [
            'custId' => $custId,
            'videoId' => $videoId,
            'lastResult' => $lastResult
        ]);

        return $lastResult;
    }
}
