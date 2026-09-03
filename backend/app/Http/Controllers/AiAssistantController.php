<?php

namespace App\Http\Controllers;

use App\Models\ActiveConversations;
use App\Models\AiLiveSuggestion;
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
            'message'    => 'nullable|string',
            'image_url'  => 'nullable|string',
            'session_id' => 'nullable|string',
            'image'      => 'nullable|file|max:10240',
            // active_id/message_ref: ใช้บันทึกประวัติการ์ดวิเคราะห์นี้ลง DB (ai_live_suggestions)
            // กันหายตอนรีเฟรชหน้าจอ — เดิมเก็บแค่ React state ฝั่ง frontend
            'active_id'   => 'nullable|integer',
            'message_ref' => 'nullable|string',
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
        if (!empty($validated['session_id'])) {
            $multipart[] = ['name' => 'session_id', 'contents' => $validated['session_id']];
        }
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $multipart[] = [
                'name'     => 'image',
                'contents' => fopen($file->getRealPath(), 'rb'),
                'filename' => $file->getClientOriginalName() ?: 'image.jpg',
            ];
        } elseif (!empty($validated['image_url'])) {
            // กรณีลูกค้าส่งรูปจริง (ไม่ใช่พิมพ์ลิงก์เอง) — frontend ส่งมาแค่ image_url (URL รูปที่ระบบเรา
            // ไปโหลดจาก LINE แล้วอัปขึ้น S3) ไม่มีไฟล์แนบ ถ้าปล่อยให้ chat-oc-any (อยู่คนละวงเครือข่าย
            // เช่น 192.168.9.32) ไปโหลด URL เองอาจโหลดไม่ได้ (เข้าไม่ถึง S3/สิทธิ์ไม่พอ) จึงตอบแบบทั่วไปแทน
            // ที่นี่จึงโหลดรูปจริงจาก image_url ฝั่ง backend เอง (ซึ่งเพิ่งอัปขึ้น S3 เองจึงเข้าถึงได้แน่นอน)
            // แล้วแนบเป็นไฟล์ image ไปด้วย ให้ chat-oc-any วิเคราะห์รูปได้เหมือนกรณีพิมพ์ลิงก์
            try {
                $imgRes = (new \GuzzleHttp\Client(['timeout' => 15]))->get($validated['image_url']);
                $contentType = $imgRes->getHeaderLine('Content-Type') ?: 'image/jpeg';
                $imgBody = (string) $imgRes->getBody();

                if ($imgRes->getStatusCode() === 200 && str_starts_with($contentType, 'image/') && strlen($imgBody) <= 10 * 1024 * 1024) {
                    $ext = match (true) {
                        str_contains($contentType, 'png')  => 'png',
                        str_contains($contentType, 'gif')  => 'gif',
                        str_contains($contentType, 'webp') => 'webp',
                        default => 'jpg',
                    };
                    $multipart[] = [
                        'name'     => 'image',
                        'contents' => $imgBody,
                        'filename' => 'image.' . $ext,
                    ];
                }
            } catch (\Throwable $e) {
                Log::warning('liveSuggest: โหลดรูปจาก image_url ไม่สำเร็จ — ' . $e->getMessage());
            }
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

            if (!empty($validated['active_id'])) {
                $this->storeLiveSuggestion($validated, is_array($json) ? $json : []);
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
     * บันทึกการ์ดวิเคราะห์ AI (ตอบสด) ของรอบนี้ลง ai_live_suggestions ให้เป็นประวัติถาวร
     * แมปฟิลด์ตามตรรกะเดียวกับที่ frontend เคยทำเอง (Info/main.jsx) เพื่อให้หน้าประวัติ
     * แสดงผลเหมือนตอนที่เพิ่งได้คำตอบสด ๆ มา — ไม่กระทบ response ที่ส่งกลับ frontend (คงรูปแบบเดิม)
     */
    private function storeLiveSuggestion(array $validated, array $json): void
    {
        try {
            $isImage = !empty($validated['image_url']) && empty($validated['message']);
            $questionFallback = $isImage ? '[ลูกค้าส่งรูปภาพ]' : ($validated['message'] ?? null);

            $reference = null;
            if (!empty($json['resolved_product']) && is_array($json['resolved_product'])) {
                // resolved_product มีฟิลด์ spec_rows เป็น array ซ้อน array (เช่น [["Rated Power","20V"], ...])
                // ต้องกรองออกก่อน ไม่งั้น "{$k}: {$v}" จะพยายามแปลง array เป็น string ซึ่ง Laravel
                // ยกระดับ warning นี้เป็น ErrorException แล้วโยนออกมา ทำให้ข้ามการบันทึกไปทั้งแถว (ไม่ถึง create() เลย)
                $reference = collect($json['resolved_product'])
                    ->filter(fn ($v) => !is_array($v) && !is_object($v) && $v !== null && $v !== '')
                    ->map(fn ($v, $k) => "{$k}: {$v}")
                    ->implode(' · ');
            }

            AiLiveSuggestion::create([
                'active_conversation_id' => (int) $validated['active_id'],
                'cust_id'                => $validated['session_id'] ?? null,
                'message_ref'            => $validated['message_ref'] ?? null,
                'question'               => $json['summarytxt'] ?? $questionFallback,
                'content'                => $json['answer'] ?? $json['reply'] ?? '',
                'source'                 => in_array($json['source'] ?? null, ['kb', 'web', 'ai'], true) ? $json['source'] : 'ai',
                'reference'              => $reference,
            ]);
        } catch (\Throwable $e) {
            // ไม่ให้การบันทึกประวัติล้มเหลวไปกระทบ response หลักที่ต้องส่งกลับ frontend
            Log::warning('liveSuggest: บันทึกประวัติ ai_live_suggestions ไม่สำเร็จ — ' . $e->getMessage());
        }
    }

    /**
     * Endpoint: ดึงประวัติการ์ดวิเคราะห์ AI (ตอบสด) ทั้งหมดของห้องแชทนี้ เรียงใหม่สุดก่อน
     * ให้ frontend โหลดมาแสดงตอนเปิด/รีเฟรชหน้าจอ แทนที่จะหายไปเพราะเก็บแค่ React state
     */
    public function liveSuggestionsHistory(int $activeId): JsonResponse
    {
        $rows = AiLiveSuggestion::query()
            ->where('active_conversation_id', $activeId)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        $suggestions = $rows->map(fn ($r) => [
            'id'          => 'live-db-' . $r->id,
            'question'    => $r->question,
            'content'     => $r->content,
            'source'      => $r->source ?: 'ai',
            'reference'   => $r->reference,
            'message_ref' => $r->message_ref,
            'created_at'  => optional($r->created_at)->toIso8601String(),
        ])->values();

        return response()->json([
            'message'   => 'success',
            'active_id' => $activeId,
            'suggestions' => $suggestions,
        ]);
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
