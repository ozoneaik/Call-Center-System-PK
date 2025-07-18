<?php

namespace App\shopee;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShopeeChatService
{
    private $partnerId;
    private $partnerKey;
    private $shopId;
    private $accessToken;
    private $baseUrl = 'https://partner.shopeemobile.com';

    public function __construct()
    {
        $this->partnerId = config('shopee.partner_id');
        $this->partnerKey = config('shopee.partner_key');
        $this->shopId = config('shopee.shop_id');
        $this->accessToken = config('shopee.access_token');

        // ตรวจสอบว่าค่า config ครบถ้วน
        if (empty($this->partnerId) || empty($this->partnerKey) || empty($this->shopId) || empty($this->accessToken)) {
            throw new \Exception('Shopee API configuration is incomplete. Please check your .env file.');
        }
    }

    /**
     * คำนวณ Sign สำหรับ Shopee API
     */
    private function generateSign($path, $timestamp, $accessToken = null, $shopId = null)
    {
        $baseString = $this->partnerId . $path . $timestamp;

        if ($accessToken) {
            $baseString .= $accessToken;
        }

        if ($shopId) {
            $baseString .= $shopId;
        }

        return hash_hmac('sha256', $baseString, $this->partnerKey);
    }

    /**
     * คำนวณ Sign สำหรับ Chat API (ไม่ใส่ shop_id ใน base string)
     */
    private function generateChatSign($path, $timestamp, $accessToken)
    {
        $baseString = $this->partnerId . $path . $timestamp . $accessToken;
        return hash_hmac('sha256', $baseString, $this->partnerKey);
    }

    /**
     * สร้าง Common Parameters สำหรับ API Call
     */
    private function getCommonParams($path, $includeShop = true)
    {
        $timestamp = time();
        $params = [
            'partner_id' => (int)$this->partnerId,
            'timestamp' => $timestamp,
            'access_token' => $this->accessToken,
        ];

        if ($includeShop) {
            $params['shop_id'] = (int)$this->shopId;
            $params['sign'] = $this->generateSign($path, $timestamp, $this->accessToken, $this->shopId);
        } else {
            $params['sign'] = $this->generateSign($path, $timestamp, $this->accessToken);
        }

        return $params;
    }

    /**
     * สร้าง Common Parameters สำหรับ Chat API Call
     */
    private function getChatParams($path)
    {
        $timestamp = time();
        $params = [
            'partner_id' => (int)$this->partnerId,
            'timestamp' => $timestamp,
            'access_token' => $this->accessToken,
            'shop_id' => (int)$this->shopId,
            'sign' => $this->generateChatSign($path, $timestamp, $this->accessToken)
        ];

        return $params;
    }

    /**
     * ดึงรายการการสนทนาทั้งหมด
     */
    public function getConversations($pageSize = 20, $cursor = null)
    {
        $path = '/api/v2/sellerchat/get_conversation_list';
        $params = $this->getChatParams($path);
        $params['page_size'] = $pageSize;

        if ($cursor) {
            $params['cursor'] = $cursor;
        }

        // Debug log
        Log::info('Get Conversations Request:', [
            'url' => $this->baseUrl . $path,
            'params' => array_merge($params, ['access_token' => substr($this->accessToken, 0, 10) . '...']),
            'sign_input' => $this->partnerId . $path . $params['timestamp'] . $this->accessToken
        ]);

        try {
            $response = Http::get($this->baseUrl . $path, $params);

            if (!$response->successful()) {
                Log::error('HTTP Error: ' . $response->status() . ' - ' . $response->body());
                return [
                    'success' => false,
                    'error' => 'HTTP Error: ' . $response->status() . ' - ' . $response->body()
                ];
            }

            $data = $response->json();
            Log::info('Get Conversations Response:', $data);

            if (isset($data['error']) && $data['error'] === '') {
                return [
                    'success' => true,
                    'data' => $data['response'],
                    'conversations' => $data['response']['conversation_list'] ?? [],
                    'next_cursor' => $data['response']['next_cursor'] ?? null,
                    'has_more' => $data['response']['has_more'] ?? false
                ];
            } else {
                Log::error('Shopee API Error: ' . ($data['message'] ?? $data['error'] ?? 'Unknown error'));
                return [
                    'success' => false,
                    'error' => $data['message'] ?? $data['error'] ?? 'Unknown error'
                ];
            }
        } catch (\Exception $e) {
            Log::error('HTTP Request Error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * ดึงรายการข้อความในการสนทนา
     */
    public function getMessages($conversationId, $pageSize = 20, $cursor = null)
    {
        $path = '/api/v2/sellerchat/get_message_list';
        $params = $this->getChatParams($path);
        $params['conversation_id'] = $conversationId;
        $params['page_size'] = $pageSize;

        if ($cursor) {
            $params['cursor'] = $cursor;
        }

        // Debug log
        Log::info('Get Messages Request:', [
            'url' => $this->baseUrl . $path,
            'params' => array_merge($params, ['access_token' => substr($this->accessToken, 0, 10) . '...']),
            'sign_input' => $this->partnerId . $path . $params['timestamp'] . $this->accessToken
        ]);

        try {
            $response = Http::get($this->baseUrl . $path, $params);

            if (!$response->successful()) {
                Log::error('HTTP Error: ' . $response->status() . ' - ' . $response->body());
                return [
                    'success' => false,
                    'error' => 'HTTP Error: ' . $response->status() . ' - ' . $response->body()
                ];
            }

            $data = $response->json();
            Log::info('Get Messages Response:', $data);

            if (isset($data['error']) && $data['error'] === '') {
                return [
                    'success' => true,
                    'data' => $data['response'],
                    'messages' => $data['response']['message_list'] ?? [],
                    'next_cursor' => $data['response']['next_cursor'] ?? null,
                    'has_more' => $data['response']['has_more'] ?? false
                ];
            } else {
                Log::error('Shopee API Error: ' . ($data['message'] ?? $data['error'] ?? 'Unknown error'));
                return [
                    'success' => false,
                    'error' => $data['message'] ?? $data['error'] ?? 'Unknown error'
                ];
            }
        } catch (\Exception $e) {
            Log::error('HTTP Request Error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * ส่งข้อความ
     */
    public function sendMessage($conversationId, $content, $messageType = 'text')
    {
        $path = '/api/v2/sellerchat/send_message';
        $params = $this->getChatParams($path);

        $messageData = [
            'conversation_id' => $conversationId,
            'message_type' => $messageType,
            'content' => $content
        ];

        // Debug log
        Log::info('Send Message Request:', [
            'url' => $this->baseUrl . $path,
            'params' => array_merge($params, ['access_token' => substr($this->accessToken, 0, 10) . '...']),
            'data' => $messageData,
            'sign_input' => $this->partnerId . $path . $params['timestamp'] . $this->accessToken
        ]);

        try {
            $response = Http::post($this->baseUrl . $path . '?' . http_build_query($params), $messageData);

            if (!$response->successful()) {
                Log::error('HTTP Error: ' . $response->status() . ' - ' . $response->body());
                return [
                    'success' => false,
                    'error' => 'HTTP Error: ' . $response->status() . ' - ' . $response->body()
                ];
            }

            $data = $response->json();
            Log::info('Send Message Response:', $data);

            if (isset($data['error']) && $data['error'] === '') {
                return [
                    'success' => true,
                    'data' => $data['response'],
                    'message_id' => $data['response']['message_id'] ?? null
                ];
            } else {
                Log::error('Shopee API Error: ' . ($data['message'] ?? $data['error'] ?? 'Unknown error'));
                return [
                    'success' => false,
                    'error' => $data['message'] ?? $data['error'] ?? 'Unknown error'
                ];
            }
        } catch (\Exception $e) {
            Log::error('HTTP Request Error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * ส่งข้อความเป็นรูปภาพ
     */
    public function sendImageMessage($conversationId, $imageUrl)
    {
        return $this->sendMessage($conversationId, ['image_url' => $imageUrl], 'image');
    }

    /**
     * ส่งข้อความเป็นผลิตภัณฑ์
     */
    public function sendProductMessage($conversationId, $itemId)
    {
        return $this->sendMessage($conversationId, ['item_id' => $itemId], 'item');
    }

    /**
     * อัปเดตสถานะการอ่านข้อความ
     */
    public function markAsRead($conversationId)
    {
        $path = '/api/v2/sellerchat/read_conversation';
        $params = $this->getChatParams($path);

        $messageData = [
            'conversation_id' => $conversationId
        ];

        // Debug log
        Log::info('Mark as Read Request:', [
            'url' => $this->baseUrl . $path,
            'params' => array_merge($params, ['access_token' => substr($this->accessToken, 0, 10) . '...']),
            'data' => $messageData,
            'sign_input' => $this->partnerId . $path . $params['timestamp'] . $this->accessToken
        ]);

        try {
            $response = Http::post($this->baseUrl . $path . '?' . http_build_query($params), $messageData);

            if (!$response->successful()) {
                Log::error('HTTP Error: ' . $response->status() . ' - ' . $response->body());
                return [
                    'success' => false,
                    'error' => 'HTTP Error: ' . $response->status() . ' - ' . $response->body()
                ];
            }

            $data = $response->json();
            Log::info('Mark as Read Response:', $data);

            return [
                'success' => (isset($data['error']) && $data['error'] === ''),
                'error' => (isset($data['error']) && $data['error'] !== '') ? ($data['message'] ?? $data['error']) : null
            ];
        } catch (\Exception $e) {
            Log::error('HTTP Request Error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * ดึงข้อมูลร้านค้า
     */
    public function getShopInfo()
    {
        $path = '/api/v2/shop/get_shop_info';
        $params = $this->getCommonParams($path);

        try {
            $response = Http::get($this->baseUrl . $path, $params);

            if (!$response->successful()) {
                Log::error('HTTP Error: ' . $response->status() . ' - ' . $response->body());
                return [
                    'success' => false,
                    'error' => 'HTTP Error: ' . $response->status()
                ];
            }

            $data = $response->json();

            // Debug log
            Log::info('Shopee API Response:', $data);

            if (isset($data['error']) && $data['error'] === '') {
                return [
                    'success' => true,
                    'data' => $data['response'] ?? $data
                ];
            } else {
                return [
                    'success' => false,
                    'error' => $data['message'] ?? $data['error'] ?? 'Unknown error'
                ];
            }
        } catch (\Exception $e) {
            Log::error('Exception in getShopInfo: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * ทดสอบการเชื่อมต่อ
     */
    public function testConnection()
    {
        try {
            // ทดสอบการสร้าง Sign ก่อน
            $path = '/api/v2/shop/get_shop_info';
            $timestamp = time();
            $sign = $this->generateSign($path, $timestamp, $this->accessToken, $this->shopId);

            Log::info('Generated Sign Test:', [
                'path' => $path,
                'timestamp' => $timestamp,
                'partner_id' => $this->partnerId,
                'shop_id' => $this->shopId,
                'access_token' => substr($this->accessToken, 0, 10) . '...',
                'sign' => $sign
            ]);

            $shopInfo = $this->getShopInfo();

            if ($shopInfo['success']) {
                Log::info('Shopee API connection successful');
                return [
                    'success' => true,
                    'message' => 'เชื่อมต่อสำเร็จ',
                    'shop_name' => $shopInfo['data']['shop_name'] ?? 'N/A',
                    'shop_id' => $shopInfo['data']['shop_id'] ?? 'N/A',
                    'timestamp' => $timestamp,
                    'sign' => $sign
                ];
            } else {
                Log::error('Shopee API connection failed: ' . $shopInfo['error']);
                return [
                    'success' => false,
                    'message' => 'เชื่อมต่อล้มเหลว: ' . $shopInfo['error'],
                    'timestamp' => $timestamp,
                    'sign' => $sign
                ];
            }
        } catch (\Exception $e) {
            Log::error('Test connection exception: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ];
        }
    }
}