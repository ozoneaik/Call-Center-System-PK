<?php

namespace App\Http\Controllers\Chats\Shopee;

use App\Http\Controllers\Controller;
use App\shopee\ShopeeChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopeeChatController extends Controller
{
    private $chatService;

    public function __construct(ShopeeChatService $chatService)
    {
        $this->chatService = $chatService;
    }

    /**
     * ทดสอบ Chat API เฉพาะ
     */
    public function testChatAPI(): JsonResponse
    {
        try {
            // ทดสอบการสร้าง Sign สำหรับ Chat API
            $path = '/api/v2/sellerchat/get_conversation_list';
            $timestamp = time();
            $partnerId = config('shopee.partner_id');
            $partnerKey = config('shopee.partner_key');
            $accessToken = config('shopee.access_token');

            // สำหรับ Chat API ไม่ใส่ shop_id
            $baseString = $partnerId . $path . $timestamp . $accessToken;
            $sign = hash_hmac('sha256', $baseString, $partnerKey);

            return response()->json([
                'success' => true,
                'debug_info' => [
                    'path' => $path,
                    'timestamp' => $timestamp,
                    'partner_id' => $partnerId,
                    'base_string' => $baseString,
                    'sign' => $sign,
                    'access_token' => substr($accessToken, 0, 10) . '...'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Configuration Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ตรวจสอบการตั้งค่า API
     */
    public function debugConfig(): JsonResponse
    {
        $config = [
            'partner_id' => config('shopee.partner_id'),
            'partner_key' => config('shopee.partner_key') ? '***' . substr(config('shopee.partner_key'), -4) : null,
            'shop_id' => config('shopee.shop_id'),
            'access_token' => config('shopee.access_token') ? substr(config('shopee.access_token'), 0, 10) . '...' : null,
            'base_url' => config('shopee.base_url', 'https://partner.shopeemobile.com'),
        ];

        $missing = [];
        foreach (['partner_id', 'partner_key', 'shop_id', 'access_token'] as $key) {
            if (empty(config('shopee.' . $key))) {
                $missing[] = 'SHOPEE_' . strtoupper($key);
            }
        }

        return response()->json([
            'config' => $config,
            'missing_env' => $missing,
            'is_complete' => empty($missing)
        ]);
    }

    /**
     * ทดสอบการเชื่อมต่อ API
     */
    public function testConnection(): JsonResponse
    {
        try {
            $result = $this->chatService->testConnection();

            return response()->json([
                'success' => $result['success'],
                'message' => $result['message'],
                'shop_name' => $result['shop_name'] ?? null,
                'shop_id' => $result['shop_id'] ?? null,
                'timestamp' => $result['timestamp'] ?? null,
                'sign' => $result['sign'] ?? null
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Configuration Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ดึงรายการการสนทนาทั้งหมด
     */
    public function getConversations(Request $request): JsonResponse
    {
        $pageSize = $request->get('page_size', 20);
        $cursor = $request->get('cursor');

        $result = $this->chatService->getConversations($pageSize, $cursor);

        if ($result['success']) {
            return response()->json([
                'status' => 'success',
                'data' => $result['conversations'],
                'next_cursor' => $result['next_cursor'],
                'has_more' => $result['has_more'],
                'total_count' => count($result['conversations'])
            ]);
        } else {
            return response()->json([
                'status' => 'error',
                'message' => $result['error']
            ], 400);
        }
    }

    /**
     * ดึงรายการข้อความในการสนทนา
     */
    public function getMessages(Request $request, $conversationId): JsonResponse
    {
        $pageSize = $request->get('page_size', 20);
        $cursor = $request->get('cursor');

        $result = $this->chatService->getMessages($conversationId, $pageSize, $cursor);

        if ($result['success']) {
            return response()->json([
                'status' => 'success',
                'data' => $result['messages'],
                'next_cursor' => $result['next_cursor'],
                'has_more' => $result['has_more'],
                'total_count' => count($result['messages'])
            ]);
        } else {
            return response()->json([
                'status' => 'error',
                'message' => $result['error']
            ], 400);
        }
    }

    /**
     * ส่งข้อความ
     */
    public function sendMessage(Request $request): JsonResponse
    {
        $request->validate([
            'conversation_id' => 'required|string',
            'content' => 'required|string',
            'message_type' => 'in:text,image,item,order,sticker'
        ]);

        $result = $this->chatService->sendMessage(
            $request->conversation_id,
            $request->content,
            $request->message_type ?? 'text'
        );

        if ($result['success']) {
            return response()->json([
                'status' => 'success',
                'message' => 'ส่งข้อความสำเร็จ',
                'message_id' => $result['message_id']
            ]);
        } else {
            return response()->json([
                'status' => 'error',
                'message' => $result['error']
            ], 400);
        }
    }

    /**
     * ส่งรูปภาพ
     */
    public function sendImage(Request $request): JsonResponse
    {
        $request->validate([
            'conversation_id' => 'required|string',
            'image_url' => 'required|url'
        ]);

        $result = $this->chatService->sendImageMessage(
            $request->conversation_id,
            $request->image_url
        );

        if ($result['success']) {
            return response()->json([
                'status' => 'success',
                'message' => 'ส่งรูปภาพสำเร็จ',
                'message_id' => $result['message_id']
            ]);
        } else {
            return response()->json([
                'status' => 'error',
                'message' => $result['error']
            ], 400);
        }
    }

    /**
     * ส่งข้อความผลิตภัณฑ์
     */
    public function sendProduct(Request $request): JsonResponse
    {
        $request->validate([
            'conversation_id' => 'required|string',
            'item_id' => 'required|integer'
        ]);

        $result = $this->chatService->sendProductMessage(
            $request->conversation_id,
            $request->item_id
        );

        if ($result['success']) {
            return response()->json([
                'status' => 'success',
                'message' => 'ส่งผลิตภัณฑ์สำเร็จ',
                'message_id' => $result['message_id']
            ]);
        } else {
            return response()->json([
                'status' => 'error',
                'message' => $result['error']
            ], 400);
        }
    }

    /**
     * อัปเดตสถานะการอ่าน
     */
    public function markAsRead(Request $request): JsonResponse
    {
        $request->validate([
            'conversation_id' => 'required|string'
        ]);

        $result = $this->chatService->markAsRead($request->conversation_id);

        if ($result['success']) {
            return response()->json([
                'status' => 'success',
                'message' => 'อัปเดตสถานะการอ่านสำเร็จ'
            ]);
        } else {
            return response()->json([
                'status' => 'error',
                'message' => $result['error']
            ], 400);
        }
    }

    /**
     * ดึงข้อมูลร้านค้า
     */
    public function getShopInfo(): JsonResponse
    {
        $result = $this->chatService->getShopInfo();

        if ($result['success']) {
            return response()->json([
                'status' => 'success',
                'data' => $result['data']
            ]);
        } else {
            return response()->json([
                'status' => 'error',
                'message' => $result['error']
            ], 400);
        }
    }

    /**
     * Debug signature generation for Chat API
     */
    public function debugChatSignature(): JsonResponse
    {
        try {
            $path = '/api/v2/sellerchat/get_conversation_list';
            $timestamp = time();
            $partnerId = config('shopee.partner_id');
            $partnerKey = config('shopee.partner_key');
            $accessToken = config('shopee.access_token');
            $shopId = config('shopee.shop_id');

            // Chat API signature (without shop_id)
            $chatBaseString = $partnerId . $path . $timestamp . $accessToken;
            $chatSign = hash_hmac('sha256', $chatBaseString, $partnerKey);

            // Regular API signature (with shop_id)
            $regularBaseString = $partnerId . $path . $timestamp . $accessToken . $shopId;
            $regularSign = hash_hmac('sha256', $regularBaseString, $partnerKey);

            return response()->json([
                'success' => true,
                'debug_info' => [
                    'path' => $path,
                    'timestamp' => $timestamp,
                    'partner_id' => $partnerId,
                    'shop_id' => $shopId,
                    'access_token' => substr($accessToken, 0, 10) . '...',
                    'chat_api' => [
                        'base_string' => $chatBaseString,
                        'sign' => $chatSign
                    ],
                    'regular_api' => [
                        'base_string' => $regularBaseString,
                        'sign' => $regularSign
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Configuration Error: ' . $e->getMessage()
            ], 500);
        }
    }
}