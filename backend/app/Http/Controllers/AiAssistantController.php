<?php

namespace App\Http\Controllers;

use App\Models\ActiveConversations;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;

class AiAssistantController extends Controller
{
    protected CustomerService $customerService;

    public function __construct(CustomerService $customerService)
    {
        $this->customerService = $customerService;
    }

    /**
     * ตัวอย่าง endpoint สำหรับดึงคำแนะนำคำตอบจาก AI ของแชทที่กำลังดำเนินอยู่
     * รับแค่ $activeId แล้วหา custId เองจาก active_conversations (ไม่ต้องพึ่ง frontend ส่ง custId ซ้ำ กันข้อมูลไม่ตรงกัน)
     * แล้วดึงประวัติลูกค้า (history summary) มาเป็นบริบทประกอบก่อนสร้างคำแนะนำ
     * TODO: ยังเป็นข้อมูลตัวอย่าง (mock) รอต่อ logic วิเคราะห์บทสนทนาจริงจาก ChatHistory ของ $activeId
     * และค้นหา KnowledgeBaseEntry / เว็บไซต์ที่เกี่ยวข้องกับลูกค้าแล้วเรียกโมเดล AI จริง (เช่น OllamaService) แบบ real-time
     */
    public function suggestions(int $activeId): JsonResponse
    {
        $activeConversation = ActiveConversations::query()->find($activeId);

        if (!$activeConversation) {
            return response()->json([
                'message' => 'ไม่พบการสนทนานี้',
            ], 404);
        }

        $custId = $activeConversation->custId;
        $history = $this->customerService->historySummary($custId);

        return response()->json([
            'message' => 'success',
            'active_id' => $activeId,
            'cust_id' => $custId,
            'customer_history' => $history,
            'summary' => 'ลูกค้าสอบถามเกี่ยวกับขั้นตอนการส่งเคลมสินค้า โดยยังไม่ทราบวิธีการและเอกสารที่ต้องเตรียม',
            'suggestions' => [
                [
                    'id' => 1,
                    'question' => 'ส่งเคลมยังไงครับ ?',
                    'content' => 'ขอบคุณที่แจ้งเข้ามานะคะ ลูกค้าสามารถส่งเคลมสินค้าได้โดยแนบรูปสินค้า รูปใบเสร็จ/หลักฐานการสั่งซื้อ และเลขออเดอร์เข้ามาได้เลยค่ะ ทางทีมงานจะตรวจสอบและติดต่อกลับภายใน 1-2 วันทำการค่ะ',
                    'source' => 'kb',
                    'reference' => 'คลังความรู้: ขั้นตอนการเคลมสินค้า',
                ],
                [
                    'id' => 2,
                    'question' => 'ต้องเตรียมเอกสารอะไรบ้างสำหรับการเคลม ?',
                    'content' => 'รบกวนสอบถามเพิ่มเติมค่ะว่าอาการที่พบคืออะไร และสั่งซื้อสินค้ามาจากช่องทางไหน เพื่อให้ทีมงานตรวจสอบเงื่อนไขการเคลมได้ถูกต้องค่ะ',
                    'source' => 'web',
                    'reference' => 'https://www.pumpkintools.com/warranty',
                ],
            ],
        ]);
    }

    /**
     * ตัวอย่าง endpoint: ประวัติการติดต่อของลูกค้าทั้งหมด แยกตามห้อง พร้อมวิเคราะห์แต่ละคำถาม
     * (intent/category/emotion) และเทียบคำตอบที่ AI แนะนำกับคำตอบจริงที่พนักงานตอบไป
     * TODO: ยังเป็นข้อมูลตัวอย่าง (mock) รอต่อ query จริงจาก chat_histories/active_conversations
     * ของ $custId ทั้งหมด แล้ววิเคราะห์แต่ละข้อความด้วย AI จริง
     */
    public function customerAnalysis(string $custId): JsonResponse
    {
        return response()->json([
            'custId' => $custId,
            'custName' => 'Parinya',
            'overallSummary' => 'ลูกค้าคนนี้ติดต่อเข้ามาทั้งหมด 3 ครั้ง สอบถามเรื่องสถานะการจัดส่งเป็นหลัก (2 ครั้ง) และสอบถามโปรโมชั่น 1 ครั้ง',
            'topTags' => [
                ['tag' => 'shipping_inquiry', 'count' => 2],
                ['tag' => 'promotion_inquiry', 'count' => 1],
            ],
            'totalRooms' => 2,
            'totalQuestions' => 3,
            'rooms' => [
                [
                    'roomId' => 'ROOM00',
                    'conversationRef' => 153,
                    'startTime' => '2026-07-27T16:29:30',
                    'endTime' => null,
                    'roomSummary' => 'ในห้องนี้ลูกค้าถามเรื่องสถานะการจัดส่งสินค้า',
                    'questions' => [
                        [
                            'chatHistoryId' => 891,
                            'question' => 'สั่งของไปแล้วยังไม่ได้รับของเลยค่ะ เช็คให้หน่อย',
                            'analysis' => [
                                'intent' => 'check_order_status',
                                'category' => 'shipping',
                                'emotion' => 'frustrated',
                            ],
                            'aiSuggestedAnswer' => [
                                'content' => 'รบกวนแจ้งเลขที่คำสั่งซื้อหรือเบอร์โทรที่ใช้สั่งด้วยนะคะ',
                                'generated_at' => '2026-08-19T09:00:05',
                            ],
                            'agentReply' => [
                                'content' => 'รบกวนแจ้งเลขที่คำสั่งซื้อหรือเบอร์โทรที่ใช้สั่งด้วยนะคะ แอดมินรีบเช็คให้เลยค่ะ',
                                'repliedBy' => ['empCode' => 'BOT', 'name' => 'BOT'],
                                'sentAt' => '2026-08-19T09:00:06',
                                'matchedAiSuggestion' => true,
                            ],
                        ],
                        [
                            'chatHistoryId' => 902,
                            'question' => 'เลขคำสั่งซื้อคือ ORD-99231 ค่ะ',
                            'analysis' => [
                                'intent' => 'provide_order_id',
                                'category' => 'shipping',
                                'emotion' => 'neutral',
                            ],
                            'aiSuggestedAnswer' => [
                                'content' => 'กรุณารอสักครู่ค่ะ กำลังตรวจสอบสถานะพัสดุให้',
                                'generated_at' => '2026-08-19T09:02:11',
                            ],
                            'agentReply' => [
                                'content' => 'ตรวจสอบให้แล้วค่ะ พัสดุ ORD-99231 อยู่ระหว่างขนส่ง คาดว่าถึงพรุ่งนี้ค่ะ',
                                'repliedBy' => ['empCode' => 'EMP014', 'name' => 'สมหญิง'],
                                'sentAt' => '2026-08-19T09:03:40',
                                'matchedAiSuggestion' => false,
                            ],
                        ],
                    ],
                ],
                [
                    'roomId' => 'ROOM01',
                    'conversationRef' => 158,
                    'startTime' => '2026-08-01T10:00:00',
                    'endTime' => '2026-08-01T10:15:00',
                    'roomSummary' => 'ในห้องนี้ลูกค้าถามเรื่องโปรโมชั่นสินค้า',
                    'questions' => [
                        [
                            'chatHistoryId' => 940,
                            'question' => 'ตอนนี้มีโปรโมชั่นอะไรบ้างคะ',
                            'analysis' => [
                                'intent' => 'ask_promotion',
                                'category' => 'promotion',
                                'emotion' => 'neutral',
                            ],
                            'aiSuggestedAnswer' => [
                                'content' => 'ตอนนี้มีโปร ลด 20% เมื่อซื้อครบ 500 บาทค่ะ',
                                'generated_at' => '2026-08-01T10:01:00',
                            ],
                            'agentReply' => [
                                'content' => 'ตอนนี้มีโปร ลด 20% เมื่อซื้อครบ 500 บาทค่ะ',
                                'repliedBy' => ['empCode' => 'BOT', 'name' => 'BOT'],
                                'sentAt' => '2026-08-01T10:01:01',
                                'matchedAiSuggestion' => true,
                            ],
                        ],
                    ],
                ],
            ],
        ]);
    }
}
