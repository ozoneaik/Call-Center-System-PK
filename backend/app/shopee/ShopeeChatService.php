<?php

namespace App\shopee;

use Illuminate\Support\Facades\Http;
use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class ShopeeChatService
{
    private $partnerId;
    private $partnerKey;
    private $shopId;
    private $accessToken;
    private $baseUrl;

    public function __construct(string $partnerId, string $partnerKey, string $shopId, string $accessToken)
    {
        $this->partnerId = $partnerId;
        $this->partnerKey = $partnerKey;
        $this->shopId = $shopId;
        $this->accessToken = $accessToken;
        $this->baseUrl = config('shopee.base_url', 'https://partner.shopeemobile.com');
    }

    /**
     * เรียก API v2.shop.get_shop_info
     * เพื่อดึงข้อมูลร้านค้า
     * @return array
     */
    public function getShopInfo(): array
    {
        try {
            $path = '/api/v2/shop/get_shop_info';
            $timestamp = time();

            $baseString = $this->partnerId . $path . $timestamp . $this->accessToken . $this->shopId;
            $sign = hash_hmac('sha256', $baseString, $this->partnerKey);

            $queryParams = [
                'partner_id'    => (int)$this->partnerId,
                'timestamp'     => $timestamp,
                'sign'          => $sign,
                'shop_id'       => (int)$this->shopId,
                'access_token'  => $this->accessToken,
            ];

            $response = Http::get($this->baseUrl . $path, $queryParams);

            if ($response->successful() && empty($response->json()['error'])) {
                return ['success' => true, 'data' => $response->json()];
            }
            return ['success' => false, 'message' => 'Failed to get shop info from Shopee.', 'details' => $response->json()];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'An exception occurred: ' . $e->getMessage()];
        }
    }

    /**
     * เรียก API v2.order.get_order_list
     */
    public function getOrderList(array $options = []): array
    {
        try {
            $path = '/api/v2/order/get_order_list';
            $timestamp = time();

            $baseString = $this->partnerId . $path . $timestamp . $this->accessToken . $this->shopId;
            $sign = hash_hmac('sha256', $baseString, $this->partnerKey);

            $queryParams = [
                'partner_id'    => (int)$this->partnerId,
                'timestamp'     => $timestamp,
                'sign'          => $sign,
                'shop_id'       => (int)$this->shopId,
                'access_token'  => $this->accessToken,
            ];

            $queryParams = array_merge($queryParams, $options);
            $response = Http::get($this->baseUrl . $path, $queryParams);

            if ($response->successful() && empty($response->json()['error'])) {
                return ['success' => true, 'data' => $response->json()['response']];
            }
            return ['success' => false, 'message' => 'Failed to get order list from Shopee.', 'details' => $response->json()];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'An exception occurred: ' . $e->getMessage()];
        }
    }

    /**
     * เรียก API v2.order.get_order_detail (ฉบับแก้ไข)
     *
     * @param array $orderSnList
     * @param array $options
     * @return array
     */
    public function getOrderDetail(array $orderSnList, array $options = []): array
    {
        try {
            $path = '/api/v2/order/get_order_detail';
            $timestamp = time();
            $baseString = $this->partnerId . $path . $timestamp . $this->accessToken . $this->shopId;
            $sign = hash_hmac('sha256', $baseString, $this->partnerKey);

            $queryParams = [
                'partner_id'    => (int)$this->partnerId,
                'timestamp'     => $timestamp,
                'sign'          => $sign,
                'shop_id'       => (int)$this->shopId,
                'access_token'  => $this->accessToken,
                'order_sn_list' => implode(',', $orderSnList),
            ];

            if (isset($options['response_optional_fields'])) {
                $queryParams['response_optional_fields'] = $options['response_optional_fields'];
            }

            $response = Http::get($this->baseUrl . $path, $queryParams);

            if ($response->successful() && empty($response->json()['error'])) {
                return ['success' => true, 'data' => $response->json()['response']];
            }
            return ['success' => false, 'message' => 'Failed to get order detail from Shopee.', 'details' => $response->json()];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'An exception occurred: ' . $e->getMessage()];
        }
    }

    /**
     * เรียก API v2.sellerchat.get_conversation_list
     */
    public function getConversationList(array $options = []): array
    {
        try {
            $path = '/api/v2/sellerchat/get_conversation_list';
            $timestamp = time();
            $baseString = $this->partnerId . $path . $timestamp . $this->accessToken . $this->shopId;
            $sign = hash_hmac('sha256', $baseString, $this->partnerKey);

            $defaultParams = [
                'direction' => 'older',
                'type' => 'all',
                'page_size' => 20
            ];
            $finalOptions = array_merge($defaultParams, $options);

            $queryParams = [
                'partner_id'    => (int)$this->partnerId,
                'timestamp'     => $timestamp,
                'sign'          => $sign,
                'shop_id'       => (int)$this->shopId,
                'access_token'  => $this->accessToken,
            ];
            $queryParams = array_merge($queryParams, $finalOptions);
            $response = Http::get($this->baseUrl . $path, $queryParams);

            if ($response->successful() && empty($response->json()['error'])) {
                return ['success' => true, 'data' => $response->json()['response']];
            }
            return ['success' => false, 'message' => 'Failed to get conversation list from Shopee.', 'details' => $response->json()];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'An exception occurred: ' . $e->getMessage()];
        }
    }

    /**
     * เรียก API v2.sellerchat.get_one_conversation
     */
    public function getOneConversation(string $conversationId): array
    {
        try {
            $path = '/api/v2/sellerchat/get_one_conversation';
            $timestamp = time();
            $baseString = $this->partnerId . $path . $timestamp . $this->accessToken . $this->shopId;
            $sign = hash_hmac('sha256', $baseString, $this->partnerKey);
            $queryParams = [
                'partner_id'      => (int)$this->partnerId,
                'timestamp'       => $timestamp,
                'sign'            => $sign,
                'shop_id'         => (int)$this->shopId,
                'access_token'    => $this->accessToken,
                'conversation_id' => $conversationId,
            ];
            $response = Http::get($this->baseUrl . $path, $queryParams);

            if ($response->successful() && empty($response->json()['error'])) {
                return ['success' => true, 'data' => $response->json()['response']];
            }
            return ['success' => false, 'message' => 'Failed to get the conversation from Shopee.', 'details' => $response->json()];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'An exception occurred: ' . $e->getMessage()];
        }
    }

    /**
     * เรียก API v2.sellerchat.delete_conversation
     * เพื่อลบห้องสนทนา
     *
     * @param string $conversationId
     * @param array $options
     * @return array
     */
    public function deleteConversation(string $conversationId, array $options = []): array
    {
        try {
            $path = '/api/v2/sellerchat/delete_conversation';
            $timestamp = time();
            $baseString = $this->partnerId . $path . $timestamp . $this->accessToken . $this->shopId;
            $sign = hash_hmac('sha256', $baseString, $this->partnerKey);

            $authUrl = $this->baseUrl . $path . '?' . http_build_query([
                'partner_id'    => (int)$this->partnerId,
                'timestamp'     => $timestamp,
                'sign'          => $sign,
                'shop_id'       => (int)$this->shopId,
                'access_token'  => $this->accessToken,
            ]);

            $body = array_merge([
                'conversation_id' => $conversationId,
            ], $options);

            $response = Http::post($authUrl, $body);

            if ($response->successful() && empty($response->json()['error'])) {
                return ['success' => true, 'data' => $response->json()['response'] ?? 'Conversation deleted successfully.'];
            }
            return ['success' => false, 'message' => 'Failed to delete conversation via Shopee API.', 'details' => $response->json()];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'An exception occurred: ' . $e->getMessage()];
        }
    }

    /**
     * เรียก API v2.sellerchat.get_message
     */
    public function getMessages(string $conversationId, array $options = []): array
    {
        try {
            $path = '/api/v2/sellerchat/get_message';
            $timestamp = time();
            $baseString = $this->partnerId . $path . $timestamp . $this->accessToken . $this->shopId;
            $sign = hash_hmac('sha256', $baseString, $this->partnerKey);
            $queryParams = [
                'partner_id'      => (int)$this->partnerId,
                'timestamp'       => $timestamp,
                'sign'            => $sign,
                'shop_id'         => (int)$this->shopId,
                'access_token'    => $this->accessToken,
                'conversation_id' => $conversationId,
            ];
            $queryParams = array_merge($queryParams, $options);
            $response = Http::get($this->baseUrl . $path, $queryParams);

            if ($response->successful() && empty($response->json()['error'])) {
                return ['success' => true, 'data' => $response->json()['response']];
            }
            return ['success' => false, 'message' => 'Failed to get messages from Shopee.', 'details' => $response->json()];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'An exception occurred: ' . $e->getMessage()];
        }
    }

    /**
     * เรียก API v2.sellerchat.send_message
     */
    public function sendMessage(int $toId, string $messageType, array $content, array $options = []): array
    {
        try {
            $path = '/api/v2/sellerchat/send_message';
            $timestamp = time();
            $baseString = $this->partnerId . $path . $timestamp . $this->accessToken . $this->shopId;
            $sign = hash_hmac('sha256', $baseString, $this->partnerKey);

            $authUrl = $this->baseUrl . $path . '?' . http_build_query([
                'partner_id'    => (int)$this->partnerId,
                'timestamp'     => $timestamp,
                'sign'          => $sign,
                'shop_id'       => (int)$this->shopId,
                'access_token'  => $this->accessToken,
            ]);

            $body = array_merge([
                'to_id'         => $toId,
                'message_type'  => $messageType,
                'content'       => $content,
            ], $options);

            $response = Http::post($authUrl, $body);

            if ($response->successful() && empty($response->json()['error'])) {
                return ['success' => true, 'data' => $response->json()['response']];
            }
            return ['success' => false, 'message' => 'Failed to send message via Shopee API.', 'details' => $response->json()];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'An exception occurred: ' . $e->getMessage()];
        }
    }

    /**
     * เรียก API v2.sellerchat.upload_image (Debug version)
     * เพื่ออัปโหลดรูปภาพและรับ URL
     *
     * @param UploadedFile $file
     * @return array
     */
    public function uploadImage(UploadedFile $file): array
    {
        try {
            // Validation
            if (!$file->isValid()) {
                return ['success' => false, 'message' => 'Invalid uploaded file', 'details' => 'File validation failed'];
            }

            $path = '/api/v2/sellerchat/upload_image';
            $timestamp = time();
            $baseString = $this->partnerId . $path . $timestamp . $this->accessToken . $this->shopId;
            $sign = hash_hmac('sha256', $baseString, $this->partnerKey);

            // Log การสร้าง signature สำหรับ debug
            Log::channel('shopee_cron_job_log')->debug('Shopee upload signature debug', [
                'partnerId' => $this->partnerId,
                'path' => $path,
                'timestamp' => $timestamp,
                'shopId' => $this->shopId,
                'baseString' => $baseString,
                'sign' => $sign
            ]);

            $queryParams = [
                'partner_id'    => (int)$this->partnerId,
                'timestamp'     => $timestamp,
                'sign'          => $sign,
                'shop_id'       => (int)$this->shopId,
                'access_token'  => $this->accessToken,
            ];

            $authUrl = $this->baseUrl . $path . '?' . http_build_query($queryParams);

            // Log request details
            Log::channel('shopee_cron_job_log')->info('Shopee upload image request', [
                'url' => $authUrl,
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'shop_id' => $this->shopId
            ]);

            // ส่ง request
            $response = Http::timeout(60)
                ->asMultipart()
                ->attach(
                    'file', // ตรวจสอบว่า field name ถูกต้องหรือไม่ อาจต้องเป็น 'image'
                    $file->getContent(),
                    $file->getClientOriginalName()
                )
                ->post($authUrl);

            // Log response details
            Log::channel('shopee_cron_job_log')->info('Shopee upload image response', [
                'status_code' => $response->status(),
                'headers' => $response->headers(),
                'body' => $response->body(),
                'is_successful' => $response->successful()
            ]);

            if ($response->successful()) {
                $responseData = $response->json();

                // ตรวจสอบ error ใน response
                if (isset($responseData['error']) && !empty($responseData['error'])) {
                    return [
                        'success' => false,
                        'message' => 'Shopee API error: ' . ($responseData['message'] ?? $responseData['error']),
                        'details' => $responseData
                    ];
                }

                // Success case
                if (isset($responseData['response'])) {
                    return ['success' => true, 'data' => $responseData['response']];
                } else {
                    return [
                        'success' => false,
                        'message' => 'Unexpected response format',
                        'details' => $responseData
                    ];
                }
            } else {
                // HTTP error
                $errorBody = $response->body();
                $errorData = null;

                try {
                    $errorData = $response->json();
                } catch (\Exception $e) {
                    // Response is not JSON
                }

                return [
                    'success' => false,
                    'message' => 'HTTP error ' . $response->status(),
                    'details' => [
                        'status' => $response->status(),
                        'body' => $errorBody,
                        'json' => $errorData,
                        'headers' => $response->headers()
                    ]
                ];
            }
        } catch (Exception $e) {
            Log::channel('shopee_cron_job_log')->error('Exception in uploadImage', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'Exception: ' . $e->getMessage(),
                'details' => [
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]
            ];
        }
    }

    /**
     * เรียก API v2.sellerchat.upload_video
     * เพื่ออัปโหลดไฟล์วิดีโอ
     * @param UploadedFile $file
     * @return array
     */
    public function uploadVideo(UploadedFile $file): array
    {
        try {
            $path = '/api/v2/sellerchat/upload_video';
            $timestamp = time();
            $baseString = $this->partnerId . $path . $timestamp . $this->accessToken . $this->shopId;
            $sign = hash_hmac('sha256', $baseString, $this->partnerKey);

            $authUrl = $this->baseUrl . $path . '?' . http_build_query([
                'partner_id'    => (int)$this->partnerId,
                'timestamp'     => $timestamp,
                'sign'          => $sign,
                'shop_id'       => (int)$this->shopId,
                'access_token'  => $this->accessToken,
            ]);

            $response = Http::asMultipart()
                ->attach('file', $file->getContent(), $file->getClientOriginalName())
                ->post($authUrl);

            if ($response->successful() && empty($response->json()['error'])) {
                return ['success' => true, 'data' => $response->json()['response']];
            }
            return ['success' => false, 'message' => 'Failed to upload video to Shopee.', 'details' => $response->json()];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'An exception occurred: ' . $e->getMessage()];
        }
    }

    /**
     * เรียก API v2.sellerchat.get_video_upload_result
     * เพื่อตรวจสอบสถานะการอัปโหลดวิดีโอ
     * @param string $vid
     * @return array
     */
    public function getVideoUploadResult(string $vid): array
    {
        try {
            $path = '/api/v2/sellerchat/get_video_upload_result';
            $timestamp = time();
            $baseString = $this->partnerId . $path . $timestamp . $this->accessToken . $this->shopId;
            $sign = hash_hmac('sha256', $baseString, $this->partnerKey);

            $queryParams = [
                'partner_id'    => (int)$this->partnerId,
                'timestamp'     => $timestamp,
                'sign'          => $sign,
                'shop_id'       => (int)$this->shopId,
                'access_token'  => $this->accessToken,
                'vid'           => $vid,
            ];

            $response = Http::get($this->baseUrl . $path, $queryParams);

            if ($response->successful() && empty($response->json()['error'])) {
                return ['success' => true, 'data' => $response->json()['response']];
            }
            return ['success' => false, 'message' => 'Failed to get video upload result from Shopee.', 'details' => $response->json()];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'An exception occurred: ' . $e->getMessage()];
        }
    }

    /**
     * เรียก API v2.sellerchat.delete_message
     * เพื่อลบข้อความ
     *
     * @param string $messageId
     * @param string $messageType
     * @param array $options
     * @return array
     */
    public function deleteMessage(string $messageId, string $messageType, array $options = []): array
    {
        try {
            $path = '/api/v2/sellerchat/delete_message';
            $timestamp = time();
            $baseString = $this->partnerId . $path . $timestamp . $this->accessToken . $this->shopId;
            $sign = hash_hmac('sha256', $baseString, $this->partnerKey);

            $authUrl = $this->baseUrl . $path . '?' . http_build_query([
                'partner_id'    => (int)$this->partnerId,
                'timestamp'     => $timestamp,
                'sign'          => $sign,
                'shop_id'       => (int)$this->shopId,
                'access_token'  => $this->accessToken,
            ]);

            $body = array_merge([
                'message_id'   => $messageId,
                'message_type' => $messageType,
            ], $options);

            $response = Http::post($authUrl, $body);

            if ($response->successful() && empty($response->json()['error'])) {
                return ['success' => true, 'data' => $response->json()['response'] ?? 'Message deleted successfully.'];
            }
            return ['success' => false, 'message' => 'Failed to delete message via Shopee API.', 'details' => $response->json()];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'An exception occurred: ' . $e->getMessage()];
        }
    }

    /**
     * ดึงข้อมูล Media (เช่น รูปภาพ, วิดีโอ) จาก URL ของ Shopee
     * ที่ต้องมีการยืนยันตัวตน (ฉบับแก้ไข เพิ่ม timestamp และ sign)
     *
     * @param string $mediaPath path ของ Media เช่น 'api/v4/...'
     * @return \Illuminate\Http\Client\Response
     */
    public function getMediaContent(string $mediaPath): \Illuminate\Http\Client\Response
    {
        $path = '/' . ltrim($mediaPath, '/'); // ทำให้ path ขึ้นต้นด้วย / เสมอ
        $timestamp = time();

        // สร้าง BaseString และ Signature ให้ถูกต้อง
        $baseString = $this->partnerId . $path . $timestamp . $this->accessToken . $this->shopId;
        $sign = hash_hmac('sha256', $baseString, $this->partnerKey);

        $queryParams = [
            'partner_id'   => (int)$this->partnerId,
            'shop_id'      => (int)$this->shopId,
            'access_token' => $this->accessToken,
            'timestamp'    => $timestamp,
            'sign'         => $sign,
        ];

        // ยิง GET request พร้อมพารามิเตอร์ยืนยันตัวตนที่ครบถ้วน
        return Http::timeout(60)->get($this->baseUrl . $path, $queryParams);
    }
}
