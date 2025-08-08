<?php

namespace App\Http\Controllers\Home\UserCase;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class UcSummaryController extends Controller
{
    // รวมยอดต่อพนักงาน + รองรับช่วงวันที่ + หลายแท็ก
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

        // ===== success ภายในช่วง (กรองแท็กได้) =====
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

        if (!empty($tagIds)) {
            $successQuery->whereIn('r.tag', $tagIds);
        }

        $successResults = $successQuery
            ->groupBy('ac.empCode', 'u.name', 'u.description')
            ->get();

        // ===== progress วันนี้ตามช่วง (ไม่ผูก tag) =====
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
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->groupBy('ac.empCode', 'u.name', 'u.description')
            ->get();

        // ===== success สัปดาห์นี้ (รองรับ tag) =====
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

        if (!empty($tagIds)) {
            $weekSuccessQuery->whereIn('r.tag', $tagIds);
        }

        $weekSuccessResults = $weekSuccessQuery
            ->groupBy('ac.empCode', 'u.name', 'u.description')
            ->get();

        // ===== success เดือนนี้ (รองรับ tag) =====
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

        if (!empty($tagIds)) {
            $monthSuccessQuery->whereIn('r.tag', $tagIds);
        }

        $monthSuccessResults = $monthSuccessQuery
            ->groupBy('ac.empCode', 'u.name', 'u.description')
            ->get();

        // ===== การส่งต่อเคสในช่วง (ไม่ผูก tag) =====
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
            ->whereBetween('ac.updated_at', [$start, $end])
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
}
