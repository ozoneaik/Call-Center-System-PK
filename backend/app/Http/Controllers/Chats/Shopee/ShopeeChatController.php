<?php

namespace App\Http\Controllers\Chats\Shopee;

use App\Http\Controllers\Controller;
use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\shopee\ShopeeChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopeeChatController extends Controller
{
    /**
     * Helper function สำหรับสร้าง ShopeeChatService instance จาก shop_id
     * จะทำการค้นหา token จากฐานข้อมูลและสร้าง service instance ใหม่
     *
     * @param string $shopId
     * @return ShopeeChatService|null
     */
    private function getChatService(string $shopId): ?ShopeeChatService
    {
        $token = PlatformAccessTokens::where('platform', 'shopee')
            ->where('shopee_shop_id', $shopId)
            ->first();

        if (!$token) {
            return null;
        }

        return new ShopeeChatService(
            $token->shopee_partner_id,
            $token->shopee_partner_key,
            $token->shopee_shop_id,
            $token->accessToken
        );
    }

    /**
     * ดึงข้อมูลร้านค้าจาก shop_id ที่ระบุ
     * ตัวอย่าง Route: GET /api/shopee/chat/{shopId}/info
     */
    public function getShopInfo(string $shopId): JsonResponse
    {
        $chatService = $this->getChatService($shopId);
        if (!$chatService) {
            return response()->json(['status' => 'error', 'message' => "Shopee configuration for Shop ID '{$shopId}' not found."], 404);
        }

        $result = $chatService->getShopInfo();
        return $this->formatResponse($result);
    }

    /**
     * ดึงรายชื่อห้องแชททั้งหมด
     * ตัวอย่าง Route: GET /api/shopee/chat/{shopId}/conversations
     */
    public function listConversations(Request $request, string $shopId): JsonResponse
    {
        $chatService = $this->getChatService($shopId);
        if (!$chatService) {
            return response()->json(['status' => 'error', 'message' => "Shopee configuration for Shop ID '{$shopId}' not found."], 404);
        }

        $options = $request->only(['page_size', 'next_cursor', 'type', 'unread_count']);
        $result = $chatService->getConversationList($options);
        return $this->formatResponse($result);
    }

    /**
     * ดึงข้อมูลการสนทนา 1 รายการ
     * ตัวอย่าง Route: GET /api/shopee/chat/{shopId}/conversation/{conversationId}
     */
    public function getConversation(string $shopId, string $conversationId): JsonResponse
    {
        $chatService = $this->getChatService($shopId);
        if (!$chatService) {
            return response()->json(['status' => 'error', 'message' => "Shopee configuration for Shop ID '{$shopId}' not found."], 404);
        }

        $result = $chatService->getOneConversation($conversationId);
        return $this->formatResponse($result);
    }

    /**
     * ดึงประวัติข้อความจากห้องแชท
     * ตัวอย่าง Route: GET /api/shopee/chat/{shopId}/messages/{conversationId}
     */
    public function getMessages(Request $request, string $shopId, string $conversationId): JsonResponse
    {
        $chatService = $this->getChatService($shopId);
        if (!$chatService) {
            return response()->json(['status' => 'error', 'message' => "Shopee configuration for Shop ID '{$shopId}' not found."], 404);
        }

        $options = $request->only(['page_size', 'offset', 'message_id_list']);
        $result = $chatService->getMessages($conversationId, $options);
        return $this->formatResponse($result);
    }

    /**
     * ส่งข้อความไปยังผู้ใช้
     * ตัวอย่าง Route: POST /api/shopee/chat/{shopId}/send-message
     */
    public function sendMessage(Request $request, string $shopId): JsonResponse
    {
        $chatService = $this->getChatService($shopId);
        if (!$chatService) {
            return response()->json(['status' => 'error', 'message' => "Shopee configuration for Shop ID '{$shopId}' not found."], 404);
        }

        $validatedData = $request->validate([
            'to_id' => 'required|integer',
            'message_type' => 'required|string|in:text,order,item,image,sticker,video,voucher',
            'content' => 'required|array',
        ]);

        $options = $request->only(['business_type', 'conversation_id']);

        $result = $chatService->sendMessage(
            $validatedData['to_id'],
            $validatedData['message_type'],
            $validatedData['content'],
            $options
        );

        return $this->formatResponse($result);
    }

    /**
     * อัปโหลดรูปภาพสำหรับใช้ในแชท
     * ตัวอย่าง Route: POST /api/shopee/chat/57198184/upload-image
     */
    public function uploadImage(Request $request, string $shopId): JsonResponse
    {
        $chatService = $this->getChatService($shopId);
        if (!$chatService) {
            return response()->json(['status' => 'error', 'message' => "Shopee configuration for Shop ID '{$shopId}' not found."], 404);
        }

        $request->validate(['file' => 'required|file|mimes:jpg,jpeg,png,gif|max:10240']);

        $result = $chatService->uploadImage($request->file('file'));
        return $this->formatResponse($result);
    }

    /**
     * อัปโหลดวิดีโอสำหรับใช้ในแชท
     * ตัวอย่าง Route: POST /api/shopee/chat/{shopId}/upload-video
     */
    public function uploadVideo(Request $request, string $shopId): JsonResponse
    {
        $chatService = $this->getChatService($shopId);
        if (!$chatService) {
            return response()->json(['status' => 'error', 'message' => "Shopee configuration for Shop ID '{$shopId}' not found."], 404);
        }

        $request->validate([
            // ขนาดไม่เกิน 30MB (30720 KB) และอนุญาตเฉพาะไฟล์วิดีโอ
            'file' => 'required|file|mimes:mp4,mov,avi,webm|max:30720',
        ]);

        $result = $chatService->uploadVideo($request->file('file'));
        return $this->formatResponse($result);
    }

    /**
     * ตรวจสอบผลลัพธ์การอัปโหลดวิดีโอ
     * ตัวอย่าง Route: GET /api/shopee/chat/{shopId}/video-result/{vid}
     */
    public function getVideoUploadResult(string $shopId, string $vid): JsonResponse
    {
        $chatService = $this->getChatService($shopId);
        if (!$chatService) {
            return response()->json(['status' => 'error', 'message' => "Shopee configuration for Shop ID '{$shopId}' not found."], 404);
        }

        $result = $chatService->getVideoUploadResult($vid);
        return $this->formatResponse($result);
    }

    /**
     * Helper function สำหรับจัดรูปแบบ Response
     */
    private function formatResponse(array $result): JsonResponse
    {
        if ($result['success']) {
            return response()->json([
                'status' => 'success',
                'data' => $result['data']
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => $result['message'],
            'details' => $result['details'] ?? null
        ], 400);
    }
}
