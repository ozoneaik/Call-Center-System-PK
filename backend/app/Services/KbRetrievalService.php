<?php

namespace App\Services;

use App\Models\AiKbEntry;
use App\Models\KnowledgeBaseEntry;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ค้นคำตอบที่ใกล้เคียงคำถามลูกค้าจากคลังความรู้บน Postgres (connection pgsql_kb) 2 แหล่ง:
 *  - ai_kb_entries          : Q&A ที่พนักงานกด "เพิ่มเข้า KB" เองจากหน้าแชท (is_active)
 *  - knowledge_base_entries : บทสนทนาที่ผ่านการอนุมัติ (admin_status = approved, ไม่ถูก exclude)
 *
 * จัดอันดับด้วยความคล้ายของข้อความ: ใช้ pg_trgm (similarity) ถ้า extension พร้อม
 * ไม่งั้น fallback เป็น ILIKE ทั้งวลี/คำย่อย
 */
class KbRetrievalService
{
    /** ความคล้ายขั้นต่ำที่ยอมรับ (0-1) เมื่อใช้ pg_trgm */
    private const MIN_SIMILARITY = 0.08;

    /** โบนัสให้รายการที่พนักงานคัดเอง (ai_kb_entries) ขึ้นก่อนเล็กน้อย */
    private const CURATED_BOOST = 0.15;

    /**
     * @return array<int, array{id:string, question:string, content:string, source:string, reference:?string}>
     */
    public function retrieve(string $query, int $limit = 5): array
    {
        $query = trim($query);
        if ($query === '') {
            return [];
        }

        $useTrgm = $this->supportsTrigram();

        $merged = array_merge(
            $this->searchAiKbEntries($query, $limit, $useTrgm),
            $this->searchApprovedEntries($query, $limit, $useTrgm),
        );

        usort($merged, fn ($a, $b) => $b['score'] <=> $a['score']);

        return array_map(function ($row) {
            unset($row['score']);
            return $row;
        }, array_slice($merged, 0, $limit));
    }

    private function supportsTrigram(): bool
    {
        static $cached = null;
        if ($cached !== null) {
            return $cached;
        }
        try {
            $cached = DB::connection('pgsql_kb')
                ->selectOne("SELECT 1 AS ok FROM pg_extension WHERE extname = 'pg_trgm'") !== null;
        } catch (\Throwable $e) {
            Log::warning('KbRetrievalService: ตรวจ pg_trgm ไม่สำเร็จ — ' . $e->getMessage());
            $cached = false;
        }
        return $cached;
    }

    private function searchAiKbEntries(string $query, int $limit, bool $useTrgm): array
    {
        try {
            $q = AiKbEntry::query()
                ->where('is_active', true)
                ->whereNotNull('answer');

            $this->applyMatch($q, 'question', $query, $useTrgm, 'updated_at');

            return $q->limit($limit)->get()->map(fn ($e) => [
                'id'        => 'aikb-' . $e->id,
                'question'  => $e->question,
                'content'   => $e->answer,
                'source'    => 'kb',
                'reference' => $e->tag_name
                    ? 'คลังความรู้: ' . $e->tag_name
                    : 'คลังความรู้ (พนักงานเพิ่มเอง)',
                'score'     => ($useTrgm ? (float) ($e->score ?? 0) : 0.6) + self::CURATED_BOOST,
            ])->all();
        } catch (\Throwable $e) {
            Log::warning('KbRetrievalService@searchAiKbEntries: ' . $e->getMessage());
            return [];
        }
    }

    private function searchApprovedEntries(string $query, int $limit, bool $useTrgm): array
    {
        try {
            $q = KnowledgeBaseEntry::query()
                ->where('admin_status', 'approved')
                ->where('is_excluded', false)
                ->whereNotNull('ai_topic');

            $this->applyMatch($q, 'ai_topic', $query, $useTrgm, 'approved_at');

            return $q->limit($limit)->get()->map(fn ($e) => [
                'id'        => 'kb-' . $e->id,
                'question'  => $e->ai_topic,
                'content'   => $e->admin_answer ?: $e->ai_answer,
                'source'    => 'kb',
                'reference' => $e->tag_name
                    ? 'บทสนทนาที่อนุมัติ: ' . $e->tag_name
                    : 'บทสนทนาที่อนุมัติแล้ว',
                'score'     => $useTrgm ? (float) ($e->score ?? 0) : 0.4,
            ])->all();
        } catch (\Throwable $e) {
            Log::warning('KbRetrievalService@searchApprovedEntries: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * ใส่เงื่อนไข match + การจัดอันดับให้ query
     *  - pg_trgm: similarity(col, query) เป็น score + คัดที่เกิน MIN_SIMILARITY
     *  - fallback: ILIKE ทั้งวลี หรือ token ที่ยาว >= 3 ตัวอักษร, เรียงตาม $fallbackOrderCol
     */
    private function applyMatch(Builder $q, string $column, string $query, bool $useTrgm, string $fallbackOrderCol): void
    {
        if ($useTrgm) {
            $q->select('*')
                ->selectRaw("similarity({$column}, ?) AS score", [$query])
                ->whereRaw("similarity({$column}, ?) > ?", [$query, self::MIN_SIMILARITY])
                ->orderByDesc('score');
            return;
        }

        $terms = array_filter(
            preg_split('/\s+/', $query, -1, PREG_SPLIT_NO_EMPTY) ?: [],
            fn ($t) => mb_strlen($t) >= 3,
        );

        $q->where(function ($sub) use ($column, $query, $terms) {
            $sub->where($column, 'ILIKE', '%' . $query . '%');
            foreach ($terms as $t) {
                $sub->orWhere($column, 'ILIKE', '%' . $t . '%');
            }
        })->orderByDesc($fallbackOrderCol);
    }
}
