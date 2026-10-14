<?php

namespace App\Services;

use App\Http\Controllers\webhooks\new\FacebookController;
use App\Http\Controllers\webhooks\new\LineWebhookController;
use App\Http\Controllers\webhooks\new\NewLazadaController;
use App\Http\Controllers\webhooks\new\NewShopeeController;
use App\Models\AiKbEntry;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\KbAutoReplyLog;
use App\Models\KbAutoReplySetting;
use App\Models\PlatformAccessTokens;
use App\Models\Rates;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * AI ตอบอัตโนมัติจาก KB (วิธี "ค้นเองจากฐานข้อมูล")
 *
 * 1. เรียก chat-oc-summary เพื่อเอา query_used / summarytxt (คำถามลูกค้าที่ AI สรุปให้แล้ว)
 * 2. ค้นใน ai_kb_entries เอง เฉพาะรายการที่ อนุมัติแล้ว + เปิดใช้งาน + เปิด auto_reply
 *    ด้วย pg_trgm similarity เทียบกับ question และแต่ละวลีใน alt (คั่นด้วย "|")
 * 3. ส่งเมื่อ คะแนนอันดับ 1 >= min_score และ ชนะอันดับ 2 >= min_margin
 * 4. ข้อความที่ส่ง = คำตอบที่แอดมินอนุมัติไว้ใน KB ตรงตัว (admin_answer ?? answer) + ไฟล์แนบ — ไม่ใช่ข้อความที่ AI แต่ง
 *
 * mode = shadow จะบันทึกผลลง kb_auto_reply_logs อย่างเดียว ไม่ส่งถึงลูกค้า
 */
class KbAutoReplyService
{
    // ข้อความที่ค้างในคิวนานเกินนี้ (เช่น queue worker หยุดไป) ไม่ตอบแล้ว — กันส่งคำตอบช้าจนไม่เข้าบริบท
    private const MAX_MESSAGE_AGE_SECONDS = 300;

    public const SENDER_NAME = 'AI ตอบอัตโนมัติ';

    public function handle(int $chatHistoryId): void
    {
        $settings = KbAutoReplySetting::current();
        if ($settings->mode === 'off') return;

        $chat = ChatHistory::find($chatHistoryId);
        if (!$chat) return;

        $log = [
            'cust_id'                => $chat->custId,
            'active_conversation_id' => $chat->conversationRef,
            'chat_history_id'        => $chat->id,
            'customer_message'       => $chat->content,
            'mode'                   => $settings->mode,
        ];

        try {
            $customer = Customers::where('custId', $chat->custId)->first();
            $platform = $customer ? PlatformAccessTokens::find($customer->platformRef) : null;
            $rate     = Rates::where('custId', $chat->custId)->orderByDesc('id')->first();
            $log['platform'] = $platform?->platform;
            $log['room_id']  = $rate?->latestRoomId;

            if ($skip = $this->skipReason($chat, $customer, $platform, $rate)) {
                $this->writeLog($log + ['decision' => 'skipped', 'reason' => $skip]);
                return;
            }
            if (!$settings->allowsRoom($rate?->latestRoomId)) {
                $this->writeLog($log + ['decision' => 'skipped', 'reason' => 'ห้อง ' . ($rate?->latestRoomId ?? '-') . ' ไม่ได้เปิดใช้ระบบตอบอัตโนมัติ']);
                return;
            }

            // 1) ให้ AI สรุปคำถาม (ถ้าเรียกไม่สำเร็จ ยังค้นจากข้อความดิบของลูกค้าได้)
            $ai = $this->askChatOcSummary($chat->custId);
            $log['ai_query']         = $ai['query_used'] ?? null;
            $log['ai_summary']       = $ai['summarytxt'] ?? null;
            $log['ai_similarity']    = isset($ai['similarityscore']) && is_numeric($ai['similarityscore']) ? (float) $ai['similarityscore'] : null;
            $log['ai_knowledgefrom'] = $ai['knowledgefrom'] ?? null;
            if (!empty($ai['_error'])) {
                $log['reason'] = 'เรียก chat-oc-summary ไม่สำเร็จ ค้นจากข้อความลูกค้าแทน: ' . $ai['_error'];
            }

            // 2) ค้นใน KB ด้วยข้อความหลายแบบ แล้วเอาคะแนนที่ดีที่สุดของแต่ละรายการ
            $queries = array_filter([
                'ai_query'   => $log['ai_query'],
                'ai_summary' => $log['ai_summary'],
                'message'    => $chat->content,
            ], fn ($q) => is_string($q) && trim($q) !== '');
            [$top, $second] = $this->match($queries);

            $log['matched_entry_id'] = $top['id'] ?? null;
            $log['matched_score']    = $top['score'] ?? null;
            $log['matched_by']       = $top['by'] ?? null;
            $log['second_entry_id']  = $second['id'] ?? null;
            $log['second_score']     = $second['score'] ?? null;

            // 3) ตัดสินใจ
            if (!$top) {
                $this->writeLog($log + ['decision' => 'no_candidate']);
                return;
            }
            if ($top['score'] < $settings->min_score) {
                $this->writeLog($log + ['decision' => 'below_threshold']);
                return;
            }
            if ($second && ($top['score'] - $second['score']) < $settings->min_margin) {
                $this->writeLog($log + ['decision' => 'ambiguous']);
                return;
            }
            if ($this->alreadySentInConversation($chat->conversationRef, $top['id'])) {
                $this->writeLog($log + ['decision' => 'skipped', 'reason' => 'ส่งคำตอบรายการนี้ในเคสนี้ไปแล้ว']);
                return;
            }

            if ($settings->mode !== 'live') {
                $this->writeLog($log + ['decision' => 'would_send']);
                return;
            }

            // 4) ส่งจริง — เช็คซ้ำอีกรอบก่อนส่ง เพราะระหว่างรอ AI (หลายวินาที) พนักงานอาจรับเรื่อง/ตอบไปแล้ว
            $rate = Rates::where('custId', $chat->custId)->orderByDesc('id')->first();
            if ($skip = $this->skipReason($chat, $customer, $platform, $rate)) {
                $this->writeLog($log + ['decision' => 'skipped', 'reason' => 'ระหว่างรอ AI: ' . $skip]);
                return;
            }
            if (!$settings->allowsRoom($rate?->latestRoomId)) {
                $this->writeLog($log + ['decision' => 'skipped', 'reason' => 'ระหว่างรอ AI: เคสถูกย้ายไปห้อง ' . ($rate?->latestRoomId ?? '-') . ' ซึ่งไม่ได้เปิดใช้ระบบ']);
                return;
            }

            $entry  = AiKbEntry::find($top['id']);
            $result = $this->send($entry, $customer, $platform, $chat->conversationRef);
            $this->writeLog($log + [
                'decision' => $result['status'] ? 'sent' : 'send_failed',
                'reason'   => $result['status'] ? ($log['reason'] ?? null) : ($result['message'] ?? 'ส่งไม่สำเร็จ'),
            ]);
        } catch (\Throwable $e) {
            Log::error('KbAutoReplyService error: ' . $e->getMessage(), ['chat_history_id' => $chatHistoryId]);
            $this->writeLog($log + ['decision' => 'error', 'reason' => mb_substr($e->getMessage(), 0, 1000)]);
        }
    }

    /**
     * เงื่อนไขที่ต้องผ่านก่อนตอบอัตโนมัติ — คืนเหตุผลถ้าไม่ผ่าน, null ถ้าผ่าน
     */
    private function skipReason(ChatHistory $chat, ?Customers $customer, ?PlatformAccessTokens $platform, ?Rates $rate): ?string
    {
        if (!$customer || !$platform) return 'ไม่พบข้อมูลลูกค้า/แพลตฟอร์ม';
        if ($chat->contentType !== 'text' || trim((string) $chat->content) === '') return 'ไม่ใช่ข้อความตัวอักษร';
        if ($chat->created_at && $chat->created_at->diffInSeconds(now()) > self::MAX_MESSAGE_AGE_SECONDS) {
            return 'ข้อความค้างในคิวนานเกิน ' . (self::MAX_MESSAGE_AGE_SECONDS / 60) . ' นาที';
        }
        if (!$rate || $rate->status !== 'pending') {
            return 'เคสไม่ได้อยู่ในสถานะรอรับเรื่อง (' . ($rate->status ?? 'ไม่มีเคส') . ')';
        }

        // มีข้อความใหม่ตามมาหลังข้อความนี้แล้ว: ลูกค้าพิมพ์ต่อ (ข้อความใหม่จะถูกพิจารณาเอง) หรือพนักงานตอบไปแล้ว
        $newer = ChatHistory::where('custId', $chat->custId)
            ->where('id', '>', $chat->id)
            ->get(['sender']);
        foreach ($newer as $n) {
            $sender = is_string($n->sender) ? json_decode($n->sender, true) : $n->sender;
            $empCode = is_array($sender) ? ($sender['empCode'] ?? null) : null;
            if ($empCode === null) return 'ลูกค้าส่งข้อความใหม่ตามมาแล้ว';
            if ($empCode !== 'BOT') return 'พนักงานตอบลูกค้าแล้ว';
        }
        return null;
    }

    /**
     * ค้นรายการ KB ที่เปิดตอบอัตโนมัติ — คืน [อันดับ 1, อันดับ 2] แต่ละตัวเป็น ['id','score','by'] หรือ null
     */
    public function match(array $queries, bool $onlyAutoReply = true): array
    {
        $autoReplyCond = $onlyAutoReply ? 'AND e.auto_reply = TRUE' : '';
        $best = [];
        foreach ($queries as $by => $q) {
            $rows = DB::connection('pgsql_kb')->select("
                SELECT e.id,
                       GREATEST(
                           similarity(e.question, ?),
                           COALESCE((
                               SELECT MAX(similarity(btrim(a), ?))
                               FROM unnest(string_to_array(COALESCE(e.alt, ''), '|')) AS a
                               WHERE btrim(a) <> ''
                           ), 0)
                       ) AS score
                FROM ai_kb_entries e
                WHERE e.is_active = TRUE AND e.admin_status = 'approved' {$autoReplyCond}
                ORDER BY score DESC
                LIMIT 5
            ", [$q, $q]);

            foreach ($rows as $r) {
                $score = (float) $r->score;
                if ($score <= 0) continue;
                if (!isset($best[$r->id]) || $score > $best[$r->id]['score']) {
                    $best[$r->id] = ['id' => (int) $r->id, 'score' => round($score, 3), 'by' => $by];
                }
            }
        }

        usort($best, fn ($a, $b) => $b['score'] <=> $a['score']);
        return [$best[0] ?? null, $best[1] ?? null];
    }

    private function alreadySentInConversation(?int $acId, int $entryId): bool
    {
        if (!$acId) return false;
        return KbAutoReplyLog::where('active_conversation_id', $acId)
            ->where('matched_entry_id', $entryId)
            ->where('decision', 'sent')
            ->exists();
    }

    /**
     * เรียก chat-oc-summary ด้วยบริบทเดียวกับปุ่ม Generate AI (ข้อความ text ทั้งห้องของลูกค้า + รูปล่าสุด)
     */
    private function askChatOcSummary(string $custId): array
    {
        $url = config('services.chat_oc_summary.url');
        if (!$url) return ['_error' => 'ยังไม่ได้ตั้งค่า CHAT_OC_SUMMARY_URL'];

        try {
            $history = ChatHistory::where('custId', $custId)
                ->whereIn('contentType', ['text', 'image'])
                ->orderByDesc('id')
                ->limit(200)
                ->get(['content', 'contentType'])
                ->reverse()
                ->values();

            $lines = $history->where('contentType', 'text')
                ->map(fn ($h) => trim((string) $h->content))
                ->filter(fn ($c) => $c !== '')
                ->values()
                ->all();
            $lastImage = $history->where('contentType', 'image')->last();

            $payload = ['lines' => $lines, 'gender' => null, 'session_id' => $custId];
            if ($lastImage && trim((string) $lastImage->content) !== '') {
                $payload['image_url'] = trim((string) $lastImage->content);
            }

            $client = new \GuzzleHttp\Client(['timeout' => 60, 'http_errors' => false]);
            $res    = $client->request('POST', $url, ['json' => $payload]);
            $json   = json_decode((string) $res->getBody(), true);

            if ($res->getStatusCode() < 200 || $res->getStatusCode() >= 300 || !is_array($json)) {
                return ['_error' => 'HTTP ' . $res->getStatusCode()];
            }
            return $json;
        } catch (\Throwable $e) {
            return ['_error' => class_basename($e) . ': ' . $e->getMessage()];
        }
    }

    /**
     * ส่งคำตอบของรายการ KB ให้ลูกค้า ผ่านตัวส่งของแต่ละแพลตฟอร์ม (แบบ push ไม่ต้องใช้ reply token)
     * ข้อความจะถูกบันทึกลง chat_histories โดยตัวส่งเอง — sender = BOT พร้อมชื่อ "AI ตอบอัตโนมัติ" และ auto_reply_kb_id
     */
    private function send(AiKbEntry $entry, Customers $customer, PlatformAccessTokens $platform, ?int $acId): array
    {
        $messages = [[
            'content'     => $entry->admin_answer ?: $entry->answer,
            'contentType' => 'text',
        ]];
        foreach ((array) ($entry->answer_attachments ?? []) as $a) {
            if (!empty($a['url']) && in_array($a['contentType'] ?? null, ['image', 'video', 'file'], true)) {
                $messages[] = ['content' => $a['url'], 'contentType' => $a['contentType']];
            }
        }

        $botUser = User::where('empCode', 'BOT')->first();
        $bot = array_merge($botUser ? $botUser->toArray() : ['empCode' => 'BOT'], [
            'name'             => self::SENDER_NAME,
            'real_name'        => null,
            'auto_reply_kb_id' => $entry->id,
        ]);

        $platformKey = strtolower((string) $platform->platform);
        $case = [
            'status'                => true,
            'send_to_cust'          => true,
            // Shopee: menu_sended ส่งได้แค่ข้อความแรก ต้องใช้ normal (ไม่ส่ง employee → บันทึก sender เป็น bot)
            // Lazada/LINE/Facebook: normal จะบันทึก sender เป็น employee จึงใช้ menu_sended
            'type_send'             => $platformKey === 'shopee' ? 'normal' : 'menu_sended',
            'type_message'          => 'push',
            'messages'              => $messages,
            'customer'              => $customer,
            'ac_id'                 => $acId,
            'platform_access_token' => $platform,
            'reply_token'           => null,
            'bot'                   => $bot,
        ];

        $result = match ($platformKey) {
            'line'     => LineWebhookController::ReplyPushMessage($case),
            'facebook' => FacebookController::reply_push_message($case),
            'shopee'   => NewShopeeController::pushReplyMessage($case),
            'lazada'   => NewLazadaController::pushReplyMessage($case),
            default    => ['status' => false, 'message' => "ยังไม่รองรับแพลตฟอร์ม {$platform->platform}"],
        };

        return is_array($result) ? $result : ['status' => (bool) $result];
    }

    private function writeLog(array $data): void
    {
        try {
            KbAutoReplyLog::create($data);
        } catch (\Throwable $e) {
            Log::warning('KbAutoReplyService: บันทึก log ไม่สำเร็จ — ' . $e->getMessage());
        }
    }
}
