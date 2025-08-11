<?php

namespace App\Http\Controllers\Home\UserCase;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class UcSummaryController extends Controller
{
    /**
     * ใช้กรองร่วม: แผนก / พนักงาน / แพลตฟอร์ม
     * - dept: ใช้ u.description (trim เทียบ)
     * - empCode: ใช้ ac.empCode
     * - platform_id: ตัวอย่างผูกกับ ac.roomId (ถ้าของจริงอยู่คอลัมน์อื่น ปรับตรงนี้)
     */
    private function applyCommonFilters($q, Request $request)
    {
        $dept       = trim((string) $request->query('dept', ''));
        $empCode    = trim((string) $request->query('empCode', ''));
        $platformId = trim((string) $request->query('platform_id', ''));

        // ถ้าเลือกแผนก ต้องมี join users (บางคิวรี่อาจ join แล้ว)
        if ($dept !== '') {
            $joins = property_exists($q, 'joins') ? $q->joins : [];
            $hasUsersJoin = collect($joins ?? [])->contains(function ($j) {
                // $j->table เป็น string เช่น 'users as u'
                return isset($j->table) && $j->table === 'users as u';
            });
            if (!$hasUsersJoin) {
                $q->join('users as u', 'u.empCode', '=', 'ac.empCode');
            }
            $q->whereRaw('TRIM(u."description") = ?', [$dept]);
        }

        if ($empCode !== '') {
            $q->where('ac.empCode', $empCode);
        }

        // ตัวอย่าง platform ผูกกับ roomId (ถ้า schema จริงต่างจากนี้ แก้ตรงนี้)
        if ($platformId !== '') {
            $q->where('ac.roomId', $platformId);
            // หรือถ้าอยู่ที่ rates: $q->where('r.platform_id', $platformId);
        }

        return $q;
    }

    /**
     * Endpoint: ตัวเลือกแผนก
     * - ตัดช่องว่างตั้งแต่ SQL
     * - DISTINCT และ ORDER BY ในฐานข้อมูล
     * - คืน { options: [{value,label}, ...] }
     */
    public function optionsDepartments()
    {
        $rows = DB::connection('pgsql_real')
            ->table('users as u')
            ->whereNotIn('u.empCode', ['BOT', 'adminIT'])
            ->selectRaw('DISTINCT TRIM(u."description") AS description')
            ->whereRaw('NULLIF(TRIM(u."description"), \'\') IS NOT NULL')
            ->orderBy('description', 'asc')
            ->pluck('description') // => ["ขายของออนไลน์","บริการหลังการขาย",...]
            ->map(fn($d) => ['value' => $d, 'label' => $d])
            ->values()
            ->toArray();

        return response()->json(['options' => $rows]);
    }

    /**
     * รวมยอดต่อพนักงาน + รองรับช่วงวันที่ + หลายแท็ก (+ ฟิลเตอร์แผนก/พนักงาน/แพลตฟอร์ม)
     */
    public function index(Request $request)
    {
        // ===== ช่วงวันที่ =====
        $startDate = $request->query('start_date');
        $endDate   = $request->query('end_date');

        if ($startDate && !$endDate) $endDate = $startDate;
        if ($endDate && !$startDate) $startDate = $endDate;

        if ($startDate && $endDate) {
            $start = Carbon::parse($startDate)->startOfDay();
            $end   = Carbon::parse($endDate)->endOfDay();
        } else {
            $start = Carbon::today()->startOfDay();
            $end   = Carbon::today()->endOfDay();
        }

        // ===== หลายแท็ก: tag_ids[]=1&tag_ids[]=2 หรือ tag_ids=1,2 =====
        $tagIds = $request->query('tag_ids', []);
        if (is_string($tagIds)) {
            $tagIds = array_filter(explode(',', $tagIds));
        }

        // ===== success ภายในช่วง (กรองแท็ก/ฟิลเตอร์ร่วม) =====
        $successQuery = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->join('users as u', 'u.empCode', '=', 'ac.empCode')
            ->select(
                DB::raw('COUNT(ac."empCode") as count'),
                'ac.empCode',
                'u.name as user_name',
                'u.description as department'
            )
            ->whereBetween('ac.endTime', [$start, $end])
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT']);

        $this->applyCommonFilters($successQuery, $request);

        if (!empty($tagIds)) {
            $successQuery->whereIn('r.tag', $tagIds);
        }

        $successResults = $successQuery
            ->groupBy('ac.empCode', 'u.name', 'u.description')
            ->get();

        // ===== progress ช่วงวันที่ (ไม่ผูก tag) + ฟิลเตอร์ร่วม =====
        $progressResults = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->join('users as u', 'u.empCode', '=', 'ac.empCode')
            ->select(
                DB::raw('COUNT(ac."empCode") as countprogress'),
                'ac.empCode',
                'u.name as user_name',
                'u.description as department'
            )
            ->whereBetween('r.updated_at', [$start, $end])
            ->where('r.status', 'progress')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT']);

        $this->applyCommonFilters($progressResults, $request);

        $progressResults = $progressResults
            ->groupBy('ac.empCode', 'u.name', 'u.description')
            ->get();

        // ===== success สัปดาห์นี้ (รองรับ tag + ฟิลเตอร์ร่วม) =====
        $weekSuccessQuery = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->join('users as u', 'u.empCode', '=', 'ac.empCode')
            ->select(
                DB::raw('COUNT(ac."empCode") as countweek'),
                'ac.empCode',
                'u.name as user_name',
                'u.description as department'
            )
            ->whereBetween('ac.endTime', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT']);

        $this->applyCommonFilters($weekSuccessQuery, $request);

        if (!empty($tagIds)) {
            $weekSuccessQuery->whereIn('r.tag', $tagIds);
        }

        $weekSuccessResults = $weekSuccessQuery
            ->groupBy('ac.empCode', 'u.name', 'u.description')
            ->get();

        // ===== success เดือนนี้ (รองรับ tag + ฟิลเตอร์ร่วม) =====
        $monthSuccessQuery = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->join('users as u', 'u.empCode', '=', 'ac.empCode')
            ->select(
                DB::raw('COUNT(ac."empCode") as countmonth'),
                'ac.empCode',
                'u.name as user_name',
                'u.description as department'
            )
            ->whereBetween('ac.endTime', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()])
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT']);

        $this->applyCommonFilters($monthSuccessQuery, $request);

        if (!empty($tagIds)) {
            $monthSuccessQuery->whereIn('r.tag', $tagIds);
        }

        $monthSuccessResults = $monthSuccessQuery
            ->groupBy('ac.empCode', 'u.name', 'u.description')
            ->get();

        // ===== การส่งต่อเคสในช่วง (ไม่ผูก tag + ฟิลเตอร์ร่วม) =====
        $forwardedResults = DB::connection("pgsql_real")->table('active_conversations as ac')
            ->join('users as u', 'u.empCode', '=', 'ac.from_empCode')
            ->select(
                DB::raw('COUNT(ac."from_empCode") as countforwarded'),
                'ac.from_empCode as empCode',
                'u.name as user_name',
                'u.description as department'
            )
            ->whereNotNull('ac.from_empCode')
            ->whereNotIn('ac.from_empCode', ['BOT', 'adminIT'])
            ->whereBetween('ac.updated_at', [$start, $end]);

        // ฟิลเตอร์ร่วม (ตรงนี้ alias ของพนักงานเป็น ac.from_empCode แล้ว แต่ applyCommonFilters ยังใช้ ac.empCode)
        // ถ้าต้องการกรองตาม empCode ของ "ผู้ส่งต่อ" ให้เพิ่มเองตามจริง หรือปล่อยให้กรองเฉพาะแผนก/แพลตฟอร์ม
        $this->applyCommonFilters($forwardedResults, $request);

        $forwardedResults = $forwardedResults
            ->groupBy('ac.from_empCode', 'u.name', 'u.description')
            ->get();

        return response()->json([
            'message'      => 'Result retrieved successfully',
            'success'      => $successResults,
            'progress'     => $progressResults,
            'weekSuccess'  => $weekSuccessResults,
            'monthSuccess' => $monthSuccessResults,
            'forwarded'    => $forwardedResults,
            'range'        => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
        ]);
    }

    /**
     * รวมยอดแบบสั้น (ใช้ในหน้า dashboard ตัวเลขรวม)
     */
    public function summary()
    {
        $today = Carbon::today();

        $totalSuccessToday = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->whereDate('ac.endTime', $today)
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->count();

        $totalProgressToday = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->whereDate('r.updated_at', $today)
            ->where('r.status', 'progress')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->count();

        $totalForwardedToday = DB::connection("pgsql_real")->table('active_conversations')
            ->whereDate('updated_at', $today)
            ->whereNotNull('from_empCode')
            ->whereNotIn('from_empCode', ['BOT', 'adminIT'])
            ->count();

        $totalSuccessWeek = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->whereBetween('ac.endTime', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->count();

        $totalSuccessMonth = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->whereBetween('ac.endTime', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()])
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->count();

        return response()->json([
            'todaySuccess'    => $totalSuccessToday,
            'todayProgress'   => $totalProgressToday,
            'todayForwarded'  => $totalForwardedToday,
            'weekSuccess'     => $totalSuccessWeek,
            'monthSuccess'    => $totalSuccessMonth,
        ]);
    }

    /**
     * รายชื่อผู้ใช้งานที่ active วันนี้ (เหตุการณ์แรกสุดของวัน: progress/success/forwarded)
     */
    public function activeUsersToday()
    {
        $activeUsers = DB::connection('pgsql_real')->select("
WITH all_events_today AS (
    SELECT ac.\"empCode\", u.name, 'progress' AS event_type, r.updated_at
    FROM rates r
    JOIN active_conversations ac ON ac.\"rateRef\" = r.id
    JOIN users u ON u.\"empCode\" = ac.\"empCode\"
    WHERE r.status = 'progress'
      AND DATE(r.updated_at) = CURRENT_DATE
      AND ac.\"empCode\" NOT IN ('BOT', 'adminIT')

    UNION ALL

    SELECT ac.\"empCode\", u.name, 'success' AS event_type, r.updated_at
    FROM rates r
    JOIN active_conversations ac ON ac.\"rateRef\" = r.id
    JOIN users u ON u.\"empCode\" = ac.\"empCode\"
    WHERE r.status = 'success'
      AND DATE(r.updated_at) = CURRENT_DATE
      AND ac.\"empCode\" NOT IN ('BOT', 'adminIT')

    UNION ALL

    SELECT ac.\"from_empCode\" AS empCode, u.name, 'forwarded' AS event_type, ac.updated_at
    FROM active_conversations ac
    JOIN users u ON u.\"empCode\" = ac.\"from_empCode\"
    WHERE ac.\"from_empCode\" IS NOT NULL
      AND ac.\"from_empCode\" NOT IN ('BOT', 'adminIT')
      AND DATE(ac.updated_at) = CURRENT_DATE
)
SELECT \"empCode\", name, event_type, updated_at
FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY \"empCode\" ORDER BY updated_at ASC) as rn
    FROM all_events_today
) sub
WHERE rn = 1
ORDER BY updated_at
        ");

        return response()->json([
            'message' => 'Active users retrieved successfully',
            'active_users_today' => $activeUsers
        ]);
    }

    /**
     * กำลังดำเนินการ (แบบนิยามเดิม): status = 'progress' & r.updated_at = วันนี้
     * + แยกใน/นอกเวลาทำการด้วยเวลา receiveAt (fallback เป็น startTime)
     * + รองรับฟิลเตอร์แผนก/พนักงาน/แพลตฟอร์ม
     *
     * ช่วงเวลาในทำการ: 08:00:00–16:59:59 (17:00:00 นับเป็นนอกเวลา)
     */
    public function inProgressByBusinessHours(Request $request)
    {
        $timeExpr = 'COALESCE(ac."receiveAt", ac."startTime")';

        $q = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->where('r.status', 'progress')
            ->whereDate('r.updated_at', Carbon::today())
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT']);

        $this->applyCommonFilters($q, $request);

        $row = $q->selectRaw("
                SUM(CASE WHEN ($timeExpr)::time >= '08:00:00'
                          AND ($timeExpr)::time <  '17:00:00' THEN 1 ELSE 0 END) AS in_hours,
                SUM(CASE WHEN ($timeExpr)::time <  '08:00:00'
                          OR  ($timeExpr)::time >= '17:00:00' THEN 1 ELSE 0 END) AS out_hours,
                COUNT(*) AS total
            ")
            ->first();

        return response()->json([
            'in_time'  => (int)($row->in_hours  ?? 0),
            'out_time' => (int)($row->out_hours ?? 0),
            'total'    => (int)($row->total     ?? 0),
        ]);
    }
}
