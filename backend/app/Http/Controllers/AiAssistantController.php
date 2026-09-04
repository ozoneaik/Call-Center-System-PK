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
     * ประกอบบทสนทนาล่าสุด (ทั้งฝั่งลูกค้าและแอดมิน) ของห้องนี้ เรียงเก่า→ใหม่ เป็น transcript ข้อความเดียว
     * ให้ AI เห็นบริบทก่อนหน้าทั้งหมด ไม่ใช่แค่ประโยคเดียวโดดๆ (จำกัดจำนวนบรรทัดกันข้อความยาวเกินไป)
     * เอาเฉพาะ contentType = 'text' — รูป/ไฟล์/สติกเกอร์ ฯลฯ ไม่มีเนื้อหาที่เป็นข้อความให้ใส่ใน transcript
     * ตัดข้อความจากบอท (sender.empCode = 'BOT' เช่นข้อความเมนู/ทักทายอัตโนมัติ) ออกตั้งแต่ระดับ query เลย
     * ไม่ให้มานับรวมใน limit ด้วย — กันบอทมากินโควตาแทนที่ข้อความจริงของลูกค้า/แอดมิน
     */
    private function buildConversationContext(int $activeId, int $limit = 100): string
    {
        $messages = ChatHistory::query()
            ->where('conversationRef', $activeId)
            ->where('contentType', 'text')
            // ใช้ IS DISTINCT FROM (ไม่ใช่ != ) เพราะ sender ที่ไม่มีคีย์ empCode (ข้อความลูกค้า) จะได้ NULL
            // ออกมา ซึ่ง NULL != 'BOT' จะได้ NULL (ตัดแถวทิ้งผิดๆ) ส่วน IS DISTINCT FROM ถือ NULL ต่างจาก 'BOT' เสมอ
            ->whereRaw("(sender->>'empCode') IS DISTINCT FROM ?", ['BOT'], 'and')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get(['content', 'sender'])
            ->reverse()
            ->values();

        $lines = [];
        foreach ($messages as $m) {
            $sender = is_string($m->sender) ? json_decode($m->sender, true) : $m->sender;
            $empCode = $sender['empCode'] ?? null;
            $label = $empCode ? 'แอดมิน' : 'ลูกค้า';
            $text = trim((string) $m->content);
            if ($text !== '') {
                $lines[] = "{$label}: {$text}";
            }
        }

        return implode("\n", $lines);
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

        // ให้ AI เห็นบริบทการสนทนาก่อนหน้าทั้งฝั่งลูกค้าและแอดมิน แทนที่จะเห็นแค่ประโยคเดียวโดดๆ
        // ไม่งั้น AI จะไม่รู้ว่าคุยอะไรกันมาก่อน (เช่นแอดมินถามอะไรกลับไปแล้วลูกค้าตอบสั้นๆ ว่า "ใช่ครับ")
        // ถ้าไม่มี active_id หรือห้องนั้นยังไม่มีข้อความเลย จะ fallback ไปใช้ message ที่ frontend ส่งมาแทน
        $conversationContext = !empty($validated['active_id'])
            ? $this->buildConversationContext((int) $validated['active_id'])
            : '';
        $messageForAi = $conversationContext !== '' ? $conversationContext : (string) ($validated['message'] ?? '');

        // รูปแบบ multipart ตรงตามที่ Guzzle รองรับทุกเวอร์ชัน (list ของ name/contents)
        $multipart = [
            ['name' => 'message', 'contents' => $messageForAi],
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

            // chat-oc-any ส่ง brochure_page_url มาเป็น path สัมพัทธ์ (เช่น "/rendered/xxx.png") อ้างอิงจาก
            // host ของมันเอง ไม่ใช่ของเรา — ต้องเติม scheme+host ของ chat-oc-any (จาก config เดียวกับที่เรียก)
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
                Log::warning("liveSuggest: chat-oc-any HTTP {$status} — {$body}");
                return response()->json([
                    'message'  => 'chat-oc-any ตอบกลับผิดพลาด',
                    'upstream' => $status,
                    'body'     => mb_substr($body, 0, 500),
                ], 502);
            }

            if (!empty($validated['active_id'])) {
                $this->storeLiveSuggestion($validated, is_array($json) ? $json : [], $messageForAi);
            }

            // แนบ context_sent กลับไปด้วยเสมอ (เห็นได้ทันทีตอน debug/ยิง curl ทดสอบ) — ไม่ต้องเข้า tinker
            // เรียก buildConversationContext() ตรง ๆ เพื่อดูว่า AI เห็นบริบทอะไรไปบ้างตอนตอบรอบนี้
            $responseBody = is_array($json) ? $json : ['raw' => $body];
            $responseBody['context_sent'] = $messageForAi;

            return response()->json($responseBody);
        } catch (\Throwable $e) {
            Log::error('liveSuggest error: ' . $e->getMessage());
            return response()->json([
                'message' => 'เรียก chat-oc-any ไม่สำเร็จ',
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
    private function storeLiveSuggestion(array $validated, array $json, string $messageForAi = ''): void
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
                'context_sent'           => $messageForAi !== '' ? $messageForAi : null,
                'question'               => $json['summarytxt'] ?? $questionFallback,
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
            'context_sent'   => $r->context_sent,
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
