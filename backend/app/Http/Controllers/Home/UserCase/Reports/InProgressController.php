<?php

namespace App\Http\Controllers\Home\UserCase\Reports;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Home\UserCase\Traits\BusinessHourHelpers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InProgressController extends Controller
{
    use BusinessHourHelpers;

    public function inProgressByBusinessHours(Request $request)
    {
        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $empCode    = $request->query('empCode');
        $roomId = $request->query('roomId');

        $col = 'ac."receiveAt"';

        $row = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->where('r.status', 'progress')
            ->whereDate('ac.receiveAt', Carbon::today())
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT']);

        if (!empty($roomId)) {
            $row->where('ac.roomId', $roomId);
        }

        $row = $this->applyUserFilters($row, $dept, $empCode);
        $row = $this->applyPlatformFilter($row, $platformId);

        $row = $row->selectRaw("
            SUM(CASE WHEN ($col)::time BETWEEN '08:00:00' AND '17:00:00' AND EXTRACT(DOW FROM $col)::int <> 0 THEN 1 ELSE 0 END) AS in_hours,
            SUM(CASE WHEN (($col)::time < '08:00:00' OR ($col)::time > '17:00:00' OR EXTRACT(DOW FROM $col)::int = 0) THEN 1 ELSE 0 END) AS out_hours,
            COUNT(*) AS total
        ")->first();

        return response()->json([
            'in_time' => (int)($row->in_hours ?? 0),
            'out_time' => (int)($row->out_hours ?? 0),
            'total'   => (int)($row->total ?? 0),
        ]);
    }

    public function inProgressCases(Request $request)
    {
        $start = Carbon::parse($request->query('start_date', Carbon::today()->toDateString()))->startOfDay();
        $end   = Carbon::parse($request->query('end_date',   $start->toDateString()))->endOfDay();

        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $empCode    = $request->query('empCode');
        $roomId = $request->query('roomId');

        // hours: in | out | all (default=in)
        $hours   = $request->query('hours', 'in');
        $page    = max(1, (int) $request->query('page', 1));
        $perPage = min(200, max(1, (int) $request->query('per_page', 50)));
        $offset  = ($page - 1) * $perPage;

        $acceptedExpr = 'COALESCE(ac."receiveAt", ac."startTime")';

        $q = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('users as u', 'u.empCode', '=', 'ac.empCode')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->leftJoin('chat_rooms as cr', 'cr.roomId', '=', 'ac.roomId')
            ->where('r.status', 'progress')
            ->whereBetween(DB::raw($acceptedExpr), [$start, $end])
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT']);

        if (!empty($dept))    $q->where('u.description', $dept);
        if (!empty($empCode)) $q->where('ac.empCode', $empCode);

        if (!empty($platformId)) {
            $q->join('customers as c_pf', 'c_pf.custId', '=', 'ac.custId')
                ->join('platform_access_tokens as pat_pf', 'pat_pf.id', '=', 'c_pf.platformRef')
                ->where('pat_pf.id', $platformId);
        }
        if (!empty($roomId)) {
            $q->where('ac.roomId', $roomId);
        }

        if ($hours === 'in') {
            $q->whereRaw("$acceptedExpr::time BETWEEN '08:00:00' AND '17:00:00'")
                ->whereRaw("EXTRACT(DOW FROM $acceptedExpr)::int <> 0");
        } elseif ($hours === 'out') {
            $q->where(function ($qq) use ($acceptedExpr) {
                $qq->whereRaw("$acceptedExpr::time < '08:00:00'")
                    ->orWhereRaw("$acceptedExpr::time > '17:00:00'")
                    ->orWhereRaw("EXTRACT(DOW FROM $acceptedExpr)::int = 0");
            });
        }

        $total = (clone $q)->count();

        $elapsedExpr = "GREATEST(EXTRACT(EPOCH FROM (NOW() - $acceptedExpr)), 0)";

        $rows = $q->selectRaw('
            ac.id AS conversation_id,
            r.id  AS rate_id,
            ac."custId",
            COALESCE(NULLIF(c."custName", \'\'), ac."custId") AS customer_name,
            ac."roomId",
            cr."roomName",
            ac."empCode",
            u.name AS employee_name,
            tm."tagName" AS tag_name,
            ac."startTime",
            ac."receiveAt",
            ' . $acceptedExpr . ' AS accepted_at,
            NULL AS "endTime",
            FLOOR(' . $elapsedExpr . ')::int AS elapsed_secs
        ')
            ->orderByRaw("$acceptedExpr DESC")
            ->offset($offset)->limit($perPage)
            ->get();

        return response()->json([
            'range' => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'filters' => compact('platformId', 'dept', 'empCode', 'hours'),
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => (int) ceil($total / max(1, $perPage)),
            ],
            'data' => $rows,
        ]);
    }
}
