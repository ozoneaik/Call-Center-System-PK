<?php

namespace App\Http\Controllers\Home\UserCase\Reports;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Home\UserCase\Traits\BusinessHourHelpers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ClosedCasesController extends Controller
{
    use BusinessHourHelpers;

    public function afterHourClosedCases(Request $request)
    {
        $start = Carbon::parse($request->query('start_date', Carbon::today()->toDateString()))->startOfDay();
        $end   = Carbon::parse($request->query('end_date',   $start->toDateString()))->endOfDay();

        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $empCode    = $request->query('empCode');
        $bucket     = $request->query('bucket');

        $page     = max(1, (int) $request->query('page', 1));
        $perPage  = min(200, max(1, (int) $request->query('per_page', 50)));
        $offset   = ($page - 1) * $perPage;

        $startExpr     = $this->startExpr();
        $durationExpr  = 'EXTRACT(EPOCH FROM (ac."endTime" - ac."startTime"))';

        $q = DB::connection('pgsql_real')->table('active_conversations as ac')
            ->join('rates as r', 'r.id', '=', 'ac.rateRef')
            ->leftJoin('users as u', 'u.empCode', '=', 'ac.empCode')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->leftJoin('chat_rooms as cr', 'cr.roomId', '=', 'ac.roomId')
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->whereBetween('ac.endTime', [$start, $end]);

        if (!empty($dept))    $q->where('u.description', $dept);
        if (!empty($empCode)) $q->where('ac.empCode', $empCode);

        if (!empty($platformId)) {
            $q->join('platform_access_tokens as pat_pf', 'pat_pf.id', '=', 'c.platformRef')
                ->where('pat_pf.id', $platformId);
        }

        $q = $this->applyOutHours($q, $startExpr);

        if ($bucket) {
            switch ($bucket) {
                case 'within_1':
                    $q->whereRaw("$durationExpr <= 60");
                    break;
                case 'one_to_five':
                    $q->whereRaw("$durationExpr > 60 AND $durationExpr <= 300");
                    break;
                case 'five_to_ten':
                    $q->whereRaw("$durationExpr > 300 AND $durationExpr <= 600");
                    break;
                case 'over_ten':
                    $q->whereRaw("$durationExpr > 600");
                    break;
            }
        }

        $total = (clone $q)->count();

        $rows = $q->selectRaw('
            ac.id AS conversation_id,
            r.id  AS rate_id,
            ac."custId",
            COALESCE(NULLIF(c."custName", \'\'), ac."custId") AS customer_name,
            ac."roomId",
            cr."roomName",
            ac."empCode",
            u.name AS employee_name,
            ac."from_empCode",
            tm."tagName" AS tag_name,
            ac."startTime",
            ac."receiveAt",
            COALESCE(ac."receiveAt", ac."startTime") AS accepted_at,
            ac."endTime",
            FLOOR(GREATEST(EXTRACT(EPOCH FROM (ac."endTime" - ac."startTime")), 0))::int AS duration_secs,
            CASE
                WHEN EXTRACT(EPOCH FROM (ac."endTime" - ac."startTime")) <= 60    THEN \'ภายใน 1 นาที\'
                WHEN EXTRACT(EPOCH FROM (ac."endTime" - ac."startTime")) <= 300   THEN \'1-5 นาที\'
                WHEN EXTRACT(EPOCH FROM (ac."endTime" - ac."startTime")) <= 600   THEN \'5-10 นาที\'
                ELSE \'มากกว่า 10 นาที\'
            END AS duration_bucket
        ')
            ->orderBy('ac.endTime', 'desc')
            ->offset($offset)->limit($perPage)
            ->get();

        return response()->json([
            'range' => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'filters' => compact('platformId', 'dept', 'empCode', 'bucket'),
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => (int) ceil($total / max(1, $perPage)),
            ],
            'data' => $rows,
        ]);
    }

    public function inHourClosedCases(Request $request)
    {
        $start = Carbon::parse($request->query('start_date', Carbon::today()->toDateString()))->startOfDay();
        $end   = Carbon::parse($request->query('end_date',   $start->toDateString()))->endOfDay();

        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $empCode    = $request->query('empCode');
        $bucket     = $request->query('bucket');

        $page     = max(1, (int) $request->query('page', 1));
        $perPage  = min(200, max(1, (int) $request->query('per_page', 50)));
        $offset   = ($page - 1) * $perPage;

        $startExpr    = $this->startExpr(); // COALESCE(receiveAt, startTime)
        $durationExpr = 'EXTRACT(EPOCH FROM (ac."endTime" - ac."startTime"))';

        $q = DB::connection('pgsql_real')->table('active_conversations as ac')
            ->join('rates as r', 'r.id', '=', 'ac.rateRef')
            ->leftJoin('users as u', 'u.empCode', '=', 'ac.empCode')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->leftJoin('chat_rooms as cr', 'cr.roomId', '=', 'ac.roomId')
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->whereBetween('ac.endTime', [$start, $end]);

        if (!empty($dept))    $q->where('u.description', $dept);
        if (!empty($empCode)) $q->where('ac.empCode', $empCode);

        if (!empty($platformId)) {
            $q->join('platform_access_tokens as pat_pf', 'pat_pf.id', '=', 'c.platformRef')
                ->where('pat_pf.id', $platformId);
        }

        $q = $this->applyInHours($q, $startExpr);

        if ($bucket) {
            switch ($bucket) {
                case 'within_1':
                    $q->whereRaw("$durationExpr <= 60");
                    break;
                case 'one_to_five':
                    $q->whereRaw("$durationExpr > 60 AND $durationExpr <= 300");
                    break;
                case 'five_to_ten':
                    $q->whereRaw("$durationExpr > 300 AND $durationExpr <= 600");
                    break;
                case 'over_ten':
                    $q->whereRaw("$durationExpr > 600");
                    break;
            }
        }

        $total = (clone $q)->count();

        $rows = $q->selectRaw('
            ac.id AS conversation_id,
            r.id  AS rate_id,
            ac."custId",
            COALESCE(NULLIF(c."custName", \'\'), ac."custId") AS customer_name,
            ac."roomId",
            cr."roomName",
            ac."empCode",
            u.name AS employee_name,
            ac."from_empCode",
            tm."tagName" AS tag_name,
            ac."startTime",
            ac."receiveAt",
            COALESCE(ac."receiveAt", ac."startTime") AS accepted_at,
            ac."endTime",
            FLOOR(GREATEST(EXTRACT(EPOCH FROM (ac."endTime" - ac."startTime")), 0))::int AS duration_secs,
            CASE
                WHEN EXTRACT(EPOCH FROM (ac."endTime" - ac."startTime")) <= 60    THEN \'ภายใน 1 นาที\'
                WHEN EXTRACT(EPOCH FROM (ac."endTime" - ac."startTime")) <= 300   THEN \'1-5 นาที\'
                WHEN EXTRACT(EPOCH FROM (ac."endTime" - ac."startTime")) <= 600   THEN \'5-10 นาที\'
                ELSE \'มากกว่า 10 นาที\'
            END AS duration_bucket
        ')
            ->orderBy('ac.endTime', 'desc')
            ->offset($offset)->limit($perPage)
            ->get();

        return response()->json([
            'range' => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'filters' => compact('platformId', 'dept', 'empCode', 'bucket'),
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => (int) ceil($total / max(1, $perPage)),
            ],
            'data' => $rows,
        ]);
    }

    /** (คง endpoint เดิม) สำหรับกราฟสรุปนอกเวลาช่วงวัน */
    public function afterHourClosureRangeStats(Request $request)
    {
        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $empCode    = $request->query('empCode');

        $start      = Carbon::parse($request->input('start_date'))->startOfDay();
        $end        = Carbon::parse($request->input('end_date'))->endOfDay();

        $filterCol  = 'ac."endTime"';
        $startCol   = $this->startExpr();

        $q = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->whereBetween(DB::raw($filterCol), [$start, $end]);

        $q = $this->applyUserFilters($q, $dept, $empCode);
        $q = $this->applyPlatformFilter($q, $platformId);

        $q = $this->applyOutHours($q, $startCol)
            ->selectRaw("DATE($filterCol) AS date, " . $this->durationSelectRaw())
            ->groupBy(DB::raw("DATE($filterCol)"))
            ->orderBy(DB::raw("DATE($filterCol)"));

        $rows = $q->get();

        return response()->json([
            'message' => 'สถิติการปิดเคสนอกเวลาทำการ (อิงวันปิดเคสเหมือนการ์ด)',
            'data'    => $rows,
        ]);
    }
}
