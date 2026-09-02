<?php

namespace App\Http\Controllers;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Services\CustomerService;
use App\Services\KbRetrievalService;
use Illuminate\Http\JsonResponse;

class AiAssistantController extends Controller
{
    protected CustomerService $customerService;
    protected KbRetrievalService $kbRetrieval;

    public function __construct(CustomerService $customerService, KbRetrievalService $kbRetrieval)
    {
        $this->customerService = $customerService;
        $this->kbRetrieval = $kbRetrieval;
    }

    /**
     * Endpoint สำหรับดึงคำแนะนำคำตอบของแชทที่กำลังดำเนินอยู่
     * รับแค่ $activeId แล้วหา custId เองจาก active_conversations (ไม่ต้องพึ่ง frontend ส่ง custId ซ้ำ กันข้อมูลไม่ตรงกัน)
     * นำข้อความล่าสุดของลูกค้าไปค้นคลังความรู้ (ai_kb_entries + knowledge_base_entries ที่อนุมัติแล้ว)
     * ผ่าน KbRetrievalService แล้วคืนเป็นการ์ดคำแนะนำ source = 'kb'
     * ส่วนการ์ด source = 'ai' (ตอบสด) frontend ยิงไป chat-oc-any เองแบบ real-time
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

        $latestCustomerText = $this->latestCustomerMessage($activeId);
        $suggestions = $latestCustomerText
            ? $this->kbRetrieval->retrieve($latestCustomerText)
            : [];

        return response()->json([
            'message' => 'success',
            'active_id' => $activeId,
            'cust_id' => $custId,
            'customer_history' => $history,
            'latest_customer_message' => $latestCustomerText,
            'summary' => null,
            'suggestions' => $suggestions,
        ]);
    }

    /**
     * ข้อความ text ล่าสุดจากฝั่งลูกค้าในห้องนี้ (sender ไม่มี empCode = ลูกค้า)
     * ใช้เป็น query ค้นคลังความรู้
     */
    private function latestCustomerMessage(int $activeId): ?string
    {
        $messages = ChatHistory::query()
            ->where('conversationRef', $activeId)
            ->where('contentType', 'text')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get(['content', 'sender']);

        foreach ($messages as $m) {
            $sender = is_string($m->sender) ? json_decode($m->sender, true) : $m->sender;
            $empCode = $sender['empCode'] ?? null;
            if ($empCode === null && trim((string) $m->content) !== '') {
                return trim($m->content);
            }
        }

        return null;
    }

    /**
     * Endpoint: ประวัติการติดต่อของลูกค้าทั้งหมด แยกตามห้อง พร้อมวิเคราะห์แต่ละคำถาม
     * (intent/category/emotion) และเทียบคำตอบที่ AI แนะนำกับคำตอบจริงที่พนักงานตอบไป
     * TODO: ต่อ query จริงจาก chat_histories/active_conversations
     * ของ $custId ทั้งหมด แล้ววิเคราะห์แต่ละข้อความด้วย AI จริง
     */
    public function customerAnalysis(string $custId): JsonResponse
    {
        $detail = $this->customerService->detail($custId);

        return response()->json([
            'custId' => $custId,
            'custName' => $detail['detail']->custName ?? null,
            'overallSummary' => null,
            'topTags' => [],
            'totalRooms' => 0,
            'totalQuestions' => 0,
            'rooms' => [],
        ]);
    }
}
