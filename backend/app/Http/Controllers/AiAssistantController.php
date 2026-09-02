<?php

namespace App\Http\Controllers;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Services\CustomerService;
use App\Services\KbRetrievalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
     * Proxy ไปยัง service chat-oc-any (AI ตอบสด) ฝั่ง server
     * เดิม frontend ยิงตรงไป 127.0.0.1:7001 แต่ browser บล็อกเมื่อหน้าเว็บรันบน HTTPS domain
     * (CORS / Private Network Access เข้าถึง loopback ไม่ได้) — จึงต้องให้ backend เรียกแทน
     * คืน JSON ของ service กลับไปตรง ๆ ให้ frontend map เอง
     */
    public function liveSuggest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message'   => 'nullable|string',
            'image_url' => 'nullable|string',
            'cust_id'   => 'nullable|string',
            'image'     => 'nullable|file|max:10240',
        ]);

        $url = config('services.chat_oc_any.url');
        if (!$url) {
            return response()->json(['message' => 'ยังไม่ได้ตั้งค่า CHAT_OC_ANY_URL'], 503);
        }

        // รูปแบบ multipart ตรงตามที่ Guzzle รองรับทุกเวอร์ชัน (list ของ name/contents)
        $multipart = [
            ['name' => 'message', 'contents' => (string) ($validated['message'] ?? '')],
        ];
        if (!empty($validated['image_url'])) {
            $multipart[] = ['name' => 'image_url', 'contents' => $validated['image_url']];
        }
        if (!empty($validated['cust_id'])) {
            $multipart[] = ['name' => 'custId', 'contents' => $validated['cust_id']];
        }
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $multipart[] = [
                'name'     => 'image',
                'contents' => fopen($file->getRealPath(), 'rb'),
                'filename' => $file->getClientOriginalName() ?: 'image.jpg',
            ];
        }

        try {
            $client = new \GuzzleHttp\Client(['timeout' => 30, 'http_errors' => false]);
            $res = $client->request('POST', $url, ['multipart' => $multipart]);

            $status = $res->getStatusCode();
            $body   = (string) $res->getBody();
            $json   = json_decode($body, true);

            if ($status < 200 || $status >= 300) {
                Log::warning("liveSuggest: chat-oc-any HTTP {$status} — {$body}");
                return response()->json([
                    'message'  => 'chat-oc-any ตอบกลับผิดพลาด',
                    'upstream' => $status,
                    'body'     => mb_substr($body, 0, 500),
                ], 502);
            }

            return response()->json(is_array($json) ? $json : ['raw' => $body]);
        } catch (\Throwable $e) {
            Log::error('liveSuggest error: ' . $e->getMessage());
            return response()->json([
                'message' => 'เรียก chat-oc-any ไม่สำเร็จ',
                'error'   => class_basename($e) . ': ' . $e->getMessage(),
            ], 502);
        }
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
