<?php

namespace App\Http\Controllers;

use App\Http\Controllers\webhooks\new\FacebookController;
use App\Http\Controllers\webhooks\new\LineWebhookController;
use App\Http\Controllers\webhooks\new\NewLazadaController;
use App\Http\Controllers\webhooks\new\NewShopeeController;
use App\Models\ActiveConversations;
use App\Models\AiLiveSuggestion;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\Services\CustomerService;
use App\Services\KbRetrievalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

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

        $latestCustomerRow  = $this->latestCustomerMessageRow($activeId);
        $latestCustomerText = $latestCustomerRow ? trim((string) $latestCustomerRow->content) : null;
        // message_ref ของข้อความลูกค้าที่ใช้ค้นคลังความรู้รอบนี้ — ให้ frontend แนบไปตอนกด "เพิ่มเข้า KB"
        // จากการ์ดคำแนะนำที่มาจาก KB (source='kb') เพื่อให้รู้ว่ารายการที่บันทึกมาจากข้อความไหนในบทสนทนา
        $latestMessageRef = $latestCustomerRow ? (string) $latestCustomerRow->id : null;

        $suggestions = $latestCustomerText
            ? $this->kbRetrieval->retrieve($latestCustomerText)
            : [];

        return response()->json([
            'message' => 'success',
            'active_id' => $activeId,
            'cust_id' => $custId,
            'customer_history' => $history,
            'latest_customer_message' => $latestCustomerText,
            'latest_customer_message_ref' => $latestMessageRef,
            'summary' => null,
            'suggestions' => $suggestions,
        ]);
    }

    /**
     * แถว ChatHistory ล่าสุดจากฝั่งลูกค้าในห้องนี้ (sender ไม่มี empCode = ลูกค้า)
     * ใช้เนื้อหาไปค้นคลังความรู้ และใช้ id เป็น message_ref อ้างอิงจุดที่มาของคำแนะนำ
     */
    private function latestCustomerMessageRow(int $activeId): ?ChatHistory
    {
        $messages = ChatHistory::query()
            ->where('conversationRef', $activeId)
            ->where('contentType', 'text')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get(['id', 'content', 'sender']);

        foreach ($messages as $m) {
            $sender = is_string($m->sender) ? json_decode($m->sender, true) : $m->sender;
            $empCode = $sender['empCode'] ?? null;
            if ($empCode === null && trim((string) $m->content) !== '') {
                return $m;
            }
        }

        return null;
    }

    /**
     * Proxy ไปยัง service chat-oc-summary (AI ตอบสด) ฝั่ง server
     * เดิม frontend ยิงตรงไป 127.0.0.1:7001 แต่ browser บล็อกเมื่อหน้าเว็บรันบน HTTPS domain
     * (CORS / Private Network Access เข้าถึง loopback ไม่ได้) — จึงต้องให้ backend เรียกแทน
     * คืน JSON ของ service กลับไปตรง ๆ ให้ frontend map เอง
     *
     * เดิมยิง chat-oc-any: ส่งแค่ข้อความล่าสุดข้อความเดียว (+ แนบรูปได้) เป็น multipart/form-data
     * เปลี่ยนมาใช้ chat-oc-summary: ส่งข้อความ "ทั้งหมด" ของห้องแชทนี้ตั้งแต่เริ่ม (array "lines") เป็น
     * JSON แทน ให้ AI เห็นบริบทเต็มก่อนสรุป — endpoint ใหม่นี้ไม่รับไฟล์รูปแนบแล้ว
     *
     * up_to_message_id: ใช้ตอนกดปุ่ม "Generate AI" ย้อนหลังที่ข้อความใดข้อความหนึ่งในหน้าแชท (ไม่ใช่แค่ข้อความ
     * ล่าสุด) — จำกัด "lines" ให้เอาแค่ข้อความที่ id <= ค่านี้ (คือย้อนกลับไปถึงข้อความที่เลือก ไม่รวมข้อความที่มาทีหลัง)
     *
     * since_message_id: chat-oc-summary จำบริบทของแต่ละ session (session_id = custId) ไว้เองฝั่ง service
     * อยู่แล้ว (ดู /session/clear ที่เรียกตอนปิดเคส — ClearAiSessionJob) ดังนั้นไม่ต้องส่งบทสนทนาทั้งห้องซ้ำ
     * ทุกครั้ง — ใช้ค่านี้เป็นขอบล่างตัด "lines" ให้เหลือแค่ข้อความ "ใหม่" ที่ id > ค่านี้ (ยังไม่เคยส่งให้ AI
     * มาก่อนในรอบก่อนหน้า) ไม่ระบุมา = ยังไม่เคยส่งอะไรมาก่อนเลย (เช่น เพิ่ง /session/clear หรือครั้งแรกของห้อง)
     * จึงส่งตั้งแต่ต้นห้องเหมือนเดิม
     */
    public function liveSuggest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => 'nullable|string',
            // active_id/message_ref: ใช้บันทึกประวัติการ์ดวิเคราะห์นี้ลง DB (ai_live_suggestions)
            // กันหายตอนรีเฟรชหน้าจอ — เดิมเก็บแค่ React state ฝั่ง frontend
            // active_id ยังใช้ดึงประวัติข้อความทั้งห้องมาทำ "lines" ด้วย
            'active_id'         => 'nullable|integer',
            'message_ref'       => 'nullable|string',
            'up_to_message_id'  => 'nullable|integer',
            'since_message_id'  => 'nullable|integer',
        ]);

        $url = config('services.chat_oc_summary.url');
        if (!$url) {
            return response()->json(['message' => 'ยังไม่ได้ตั้งค่า CHAT_OC_SUMMARY_URL'], 503);
        }

        // ดึงข้อความ (contentType = text หรือ image) ของห้องนี้ เรียงเก่า -> ใหม่ ให้ chat-oc-summary เห็นบริบท
        // ตั้งแต่ต้นบทสนทนา ไม่ใช่แค่ข้อความล่าสุดข้อความเดียวเหมือน chat-oc-any เดิม — ถ้าระบุ up_to_message_id
        // มา (กด Generate AI ย้อนหลังที่ข้อความใดข้อความหนึ่ง) ให้ตัดข้อความที่มาทีหลังข้อความนั้นออก
        //
        // รูป (contentType = image) แยกส่งเป็น field "image_url" ต่างหาก (เอาแค่รูปล่าสุดในขอบเขตที่ดึงมา —
        // ถ้ามีหลายรูปเอาแค่ใบล่าสุด) ไม่ปนไปกับ lines ซึ่งเป็น text ล้วน
        //
        // ใช้ custId (session_id) เป็นหลักในการกำหนดขอบเขต "ห้องนี้" ไม่ใช่ conversationRef (active_conversation
        // เซสชันปัจจุบัน) เพราะลูกค้าคนเดียวกันอาจเคยจบสนทนา/ถูกโอนสายมาแล้วหลายรอบ (active_conversations
        // คนละแถว คนละ conversationRef) แต่หน้าจอแชทที่ frontend โหลดมาโชว์ยังต่อเนื่องกันเป็นห้องเดียวตาม
        // custId อยู่ดี (ดู DisplayService::selectMessage) — ถ้าผูกแค่ conversationRef บริบทจะขาดข้อความจาก
        // session เก่าที่ยังโชว์ค้างอยู่บนจอ ตกกรณี fallback ไป conversationRef เฉพาะตอนไม่มี custId ส่งมา
        $lines = [];
        $imageUrl = null;
        if (!empty($validated['session_id']) || !empty($validated['active_id'])) {
            $query = ChatHistory::query()->whereIn('contentType', ['text', 'image']);

            if (!empty($validated['session_id'])) {
                $query->where('custId', $validated['session_id']);
            } else {
                $query->where('conversationRef', $validated['active_id']);
            }

            if (!empty($validated['up_to_message_id'])) {
                $query->where('id', '<=', $validated['up_to_message_id']);
            }
            if (!empty($validated['since_message_id'])) {
                $query->where('id', '>', $validated['since_message_id']);
            }

            $history = $query->orderBy('created_at')->get(['content', 'contentType']);

            $lines = $history->where('contentType', 'text')
                ->map(fn ($h) => trim((string) $h->content))
                ->filter(fn ($c) => $c !== '')
                ->values()
                ->all();

            // เอารูปล่าสุด (ใบท้ายสุดในขอบเขตนี้) เผื่อลูกค้าส่งมาหลายรูป — ตัวล่าสุดตรงบริบทตอนกด Generate AI ที่สุด
            $lastImage = $history->where('contentType', 'image')
                ->filter(fn ($h) => trim((string) $h->content) !== '')
                ->last();
            if ($lastImage) {
                $imageUrl = trim((string) $lastImage->content);
            }
        }

        // บันทึก context ("lines"/"image_url") ที่กำลังจะส่งไว้ก่อนยิงจริง ให้ไล่ดูย้อนหลังได้จาก laravel.log ว่าตอนกด
        // Generate AI (หรือออโต้ทริกเกอร์) แต่ละครั้งส่งบริบทอะไรไปให้ chat-oc-summary บ้าง โดยไม่ต้องเปิด DevTools ดักจับสด ๆ
        Log::info('liveSuggest: ส่ง context ไปยัง chat-oc-summary', [
            'session_id'       => $validated['session_id'] ?? null,
            'active_id'        => $validated['active_id'] ?? null,
            'up_to_message_id' => $validated['up_to_message_id'] ?? null,
            'since_message_id' => $validated['since_message_id'] ?? null,
            'message_ref'      => $validated['message_ref'] ?? null,
            // ไว้เช็คว่า scope ของ lines อิงตาม custId (session_id) หรือ fallback ไป conversationRef
            'scope'            => !empty($validated['session_id']) ? 'custId' : 'conversationRef',
            'lines_count'      => count($lines),
            'lines'            => $lines,
            'image_url'        => $imageUrl,
        ]);

        try {
            $client = new \GuzzleHttp\Client(['timeout' => 30, 'http_errors' => false]);
            $payload = [
                'lines'  => $lines,
                // ยังไม่มีฟิลด์เพศลูกค้าจริงในระบบ (ไม่มีคอลัมน์นี้เก็บไว้ที่ไหน) ส่ง null ไปก่อน
                'gender' => null,
            ];
            // แนบ session_id ไปด้วย ให้ chat-oc-summary ผูก "lines" ที่ส่งมารอบนี้เข้ากับความจำเดิมของ
            // session เดียวกัน (ตัด lines เหลือแค่ส่วนใหม่ตาม since_message_id ด้านบนแล้ว จึงต้องพึ่งความจำ
            // ฝั่ง service เอง — ไม่งั้น AI จะเห็นบริบทไม่ครบเพราะเราไม่ได้ส่งบทสนทนาทั้งหมดซ้ำอีกต่อไป)
            if (!empty($validated['session_id'])) {
                $payload['session_id'] = $validated['session_id'];
            }
            if ($imageUrl) {
                $payload['image_url'] = $imageUrl;
            }

            $res = $client->request('POST', $url, ['json' => $payload]);

            $status = $res->getStatusCode();
            $body   = (string) $res->getBody();
            $json   = json_decode($body, true);

            // chat-oc-summary ส่ง brochure_page_url มาเป็น path สัมพัทธ์ (เช่น "/rendered/xxx.png") อ้างอิงจาก
            // host ของมันเอง ไม่ใช่ของเรา — ต้องเติม scheme+host ของ chat-oc-summary (จาก config เดียวกับที่เรียก)
            // ให้เป็น URL เต็มก่อนส่งกลับ ไม่งั้น frontend/การโหลดรูปจะเรียกผิด host (ชี้เข้าโดเมนของเราเอง)
            // ชื่อไฟล์ที่ปลายทางตั้งมามีภาษาไทย/เว้นวรรคปนอยู่แบบดิบ ๆ (ไม่ได้ percent-encode มา) ต้อง
            // encode แต่ละ path segment เองก่อน ไม่งั้น URL ที่ได้ไม่ valid ตาม RFC 3986 — เปิดรูปไม่ขึ้น/
            // โหลดรูปฝั่ง backend (Guzzle) พังได้ ขึ้นกับ client ที่ใช้งาน URL นี้ต่อ
            if (is_array($json) && !empty($json['brochure_page_url']) && is_string($json['brochure_page_url']) && str_starts_with($json['brochure_page_url'], '/')) {
                $parts = parse_url($url);
                if (!empty($parts['scheme']) && !empty($parts['host'])) {
                    $origin = $parts['scheme'] . '://' . $parts['host'] . (!empty($parts['port']) ? ':' . $parts['port'] : '');
                    $json['brochure_page_url'] = $origin . $this->encodeUrlPath($json['brochure_page_url']);
                }
            }

            if ($status < 200 || $status >= 300) {
                Log::warning("liveSuggest: chat-oc-summary HTTP {$status} — {$body}");
                return response()->json([
                    'message'  => 'chat-oc-summary ตอบกลับผิดพลาด',
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
                'message' => 'เรียก chat-oc-summary ไม่สำเร็จ',
                'error'   => class_basename($e) . ': ' . $e->getMessage(),
            ], 502);
        }
    }

    /**
     * Encode แต่ละ path segment ของ URL ให้ถูกต้องตาม RFC 3986 (เช่น ชื่อไฟล์ภาษาไทย/มีเว้นวรรค)
     * โดยไม่ไป encode ซ้ำ segment ที่ encode มาแล้ว (decode ก่อนแล้วค่อย encode ใหม่ให้ idempotent)
     * เก็บ scheme/host/port/query ไว้เหมือนเดิม แก้แค่ path
     */
    private function encodeUrlPath(string $path): string
    {
        $segments = array_map(
            fn ($segment) => rawurlencode(rawurldecode($segment)),
            explode('/', $path)
        );

        return implode('/', $segments);
    }

    /**
     * เหมือน encodeUrlPath() แต่รับ URL เต็ม (มี scheme/host) — ใช้ตอนรับ URL จาก frontend/DB เก่า
     * ที่อาจยังไม่ได้ encode path มาก่อน (เช่นแถวที่บันทึกไว้ตั้งแต่ก่อนแก้บั๊กนี้)
     */
    private function sanitizeExternalUrl(string $url): string
    {
        $parts = parse_url($url);
        if (!$parts || empty($parts['host'])) {
            return $url;
        }

        $result = ($parts['scheme'] ?? 'http') . '://' . $parts['host'];
        if (!empty($parts['port'])) {
            $result .= ':' . $parts['port'];
        }
        if (!empty($parts['path'])) {
            $result .= $this->encodeUrlPath($parts['path']);
        }
        if (!empty($parts['query'])) {
            $result .= '?' . $parts['query'];
        }

        return $result;
    }

    /**
     * บันทึกการ์ดวิเคราะห์ AI (ตอบสด) ของรอบนี้ลง ai_live_suggestions ให้เป็นประวัติถาวร
     * แมปฟิลด์ตามตรรกะเดียวกับที่ frontend เคยทำเอง (Info/main.jsx) เพื่อให้หน้าประวัติ
     * แสดงผลเหมือนตอนที่เพิ่งได้คำตอบสด ๆ มา — ไม่กระทบ response ที่ส่งกลับ frontend (คงรูปแบบเดิม)
     */
    private function storeLiveSuggestion(array $validated, array $json): void
    {
        try {
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
                'question'               => $json['summarytxt'] ?? null,
                'content'                => $json['answer'] ?? $json['reply'] ?? '',
                'source'                 => in_array($json['source'] ?? null, ['kb', 'web', 'ai'], true) ? $json['source'] : 'ai',
                'reference'              => $reference,
                'attachment_url'         => $json['brochure_page_url'] ?? null,
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
            'id'             => 'live-db-' . $r->id,
            'question'       => $r->question,
            'content'        => $r->content,
            'source'         => $r->source ?: 'ai',
            'reference'      => $r->reference,
            'message_ref'    => $r->message_ref,
            'created_at'     => optional($r->created_at)->toIso8601String(),
            'attachment_url' => $r->attachment_url,
        ])->values();

        return response()->json([
            'message'   => 'success',
            'active_id' => $activeId,
            'suggestions' => $suggestions,
        ]);
    }

    /**
     * Endpoint: ส่งรูปหน้าแคตตาล็อก/โบรชัวร์ (brochure_page_url จาก chat-oc-any) ให้ลูกค้าโดยตรงจากหน้าแชท
     * ต้องโหลดรูปจริงจาก chat-oc-any แล้วอัปขึ้น S3 ของเราเองก่อน เพราะ platform ปลายทาง (LINE/FB ฯลฯ)
     * ต้องดึงรูปจาก URL สาธารณะได้เอง — chat-oc-any อาจอยู่วง LAN ที่ platform ภายนอกเข้าไม่ถึง
     * แล้วยิงส่งผ่านกลไกเดียวกับที่ระบบใช้ส่งข้อความหาลูกค้าปกติ (ReplyPushMessage ฯลฯ) เพื่อให้ขึ้นในแชท
     * และมี pusher แจ้งเตือนแบบเดียวกับข้อความอื่น ๆ ทันที
     */
    public function sendBrochurePage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image_url' => 'required|string',
            'cust_id'   => 'required|string',
            'active_id' => 'required|integer',
        ]);

        try {
            $customer = Customers::query()->where('custId', $validated['cust_id'])->first();
            if (!$customer) {
                throw new \Exception('ไม่พบลูกค้าที่ต้องการส่งข้อความไปหา');
            }

            $conversation = ActiveConversations::query()->find($validated['active_id']);
            if (!$conversation) {
                throw new \Exception('ไม่พบห้องแชทนี้');
            }

            $platformAccessToken = PlatformAccessTokens::query()->where('id', $customer['platformRef'])->first();

            // กัน URL ที่ path มีอักขระที่ไม่ valid ตาม RFC 3986 (เช่นชื่อไฟล์ภาษาไทย/เว้นวรรคดิบ ๆ)
            // อาจเจอกับแถวเก่าที่บันทึกไว้ก่อนแก้ปัญหานี้ ให้ sanitize ซ้ำอีกชั้นก่อนโหลดเสมอ
            $imageUrl = $this->sanitizeExternalUrl($validated['image_url']);
            $imgRes = (new \GuzzleHttp\Client(['timeout' => 15]))->get($imageUrl);
            $contentType = $imgRes->getHeaderLine('Content-Type') ?: 'image/png';
            $imgBody = (string) $imgRes->getBody();
            if ($imgRes->getStatusCode() !== 200 || !str_starts_with($contentType, 'image/')) {
                throw new \Exception('โหลดรูปหน้าแคตตาล็อกจาก chat-oc-any ไม่สำเร็จ');
            }

            $ext = match (true) {
                str_contains($contentType, 'jpeg') => 'jpg',
                str_contains($contentType, 'jpg')  => 'jpg',
                str_contains($contentType, 'gif')  => 'gif',
                str_contains($contentType, 'webp') => 'webp',
                default => 'png',
            };
            $mediaPath = 'brochure_' . rand(0, 9999) . time() . '_' . $validated['cust_id'] . '.' . $ext;
            Storage::disk('s3')->put($mediaPath, $imgBody, [
                'visibility'  => 'private',
                'ContentType' => $contentType,
            ]);
            $s3Url = Storage::disk('s3')->url($mediaPath);

            $sendMessageData = [
                'status' => true,
                'case' => [
                    'status' => true,
                    'send_to_cust' => true,
                    'type_send' => 'normal',
                    'type_message' => 'push',
                    'messages' => [[
                        'content'     => $s3Url,
                        'contentType' => 'image',
                        'sender'      => 'sender',
                    ]],
                    'customer' => $customer,
                    'ac_id' => $validated['active_id'],
                    'platform_access_token' => $platformAccessToken,
                    'reply_token' => null,
                    'employee' => Auth::user(),
                ],
            ];

            $result = match ($platformAccessToken['platform'] ?? null) {
                'line'     => LineWebhookController::ReplyPushMessage($sendMessageData),
                'facebook' => FacebookController::reply_push_message($sendMessageData),
                'lazada'   => NewLazadaController::pushReplyMessage($sendMessageData),
                'shopee'   => NewShopeeController::pushReplyMessage($sendMessageData),
                default    => ['status' => false, 'message' => 'ไม่รองรับแพลตฟอร์มนี้'],
            };

            if (!($result['status'] ?? false)) {
                throw new \Exception($result['message'] ?? 'ไม่สามารถส่งรูปไปยังลูกค้าได้');
            }

            return response()->json(['message' => 'ส่งรูปหน้าแคตตาล็อกให้ลูกค้าสำเร็จ']);
        } catch (\Throwable $e) {
            Log::error('sendBrochurePage error: ' . $e->getMessage());
            return response()->json([
                'message' => 'ส่งรูปไม่สำเร็จ',
                'error'   => $e->getMessage(),
            ], 400);
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
