<?php

namespace App\Http\Controllers\Home\UserCase\Reports;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Home\UserCase\Traits\BusinessHourHelpers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PendingController extends Controller
{
    use BusinessHourHelpers;

    public function pendingToday(Request $request)
    {
        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $empCode    = $request->query('empCode');
        $roomId = $request->query('roomId');

        $q = DB::connection('pgsql_real')->table('rates as r')
            ->where('r.status', 'pending')
            ->whereDate('r.created_at', Carbon::today())
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id');

        if (!empty($roomId)) {
            $q->where('ac.roomId', $roomId);
        }
        $q = $this->applyUserFilters($q, $dept, $empCode);
        $q = $this->applyPlatformFilter($q, $platformId);

        $total = $q->count();

        return response()->json(['total' => (int)$total]);
    }

    // เผื่อใช้ในหน้า export / รายการ
    public function pendingCases(Request $request)
    {
        $start = Carbon::parse($request->query('start_date', Carbon::today()->toDateString()))->startOfDay();
        $end   = Carbon::parse($request->query('end_date',   $start->toDateString()))->endOfDay();

        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $empCode    = $request->query('empCode');
        $roomId = $request->query('roomId');

        $page     = max(1, (int) $request->query('page', 1));
        $perPage  = min(200, max(1, (int) $request->query('per_page', 50)));
        $offset   = ($page - 1) * $perPage;

        $q = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('users as u', 'u.empCode', '=', 'ac.empCode')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->leftJoin('chat_rooms as cr', 'cr.roomId', '=', 'ac.roomId')
            ->where('r.status', 'pending')
            ->whereBetween('r.created_at', [$start, $end]);

        if (!empty($dept))    $q->where('u.description', $dept);
        if (!empty($empCode)) $q->where('ac.empCode', $empCode);
        if (!empty($platformId)) {
            $q->join('platform_access_tokens as pat_pf', 'pat_pf.id', '=', 'c.platformRef')
                ->where('pat_pf.id', $platformId);
        }
        if (!empty($roomId)) {
            $q->where('ac.roomId', $roomId);
        }

        $total = (clone $q)->count();

        $rows = $q->selectRaw('
            r.id AS rate_id,
            ac.id AS conversation_id,
            ac."empCode",
            u.name AS employee_name,
            ac."custId",
            COALESCE(NULLIF(c."custName", \'\'), ac."custId") AS customer_name,
            ac."roomId",
            cr."roomName",
            r.created_at
        ')
            ->orderBy('r.created_at', 'desc')
            ->offset($offset)->limit($perPage)
            ->get();

        return response()->json([
            'range' => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'filters' => compact('platformId', 'dept', 'empCode'),
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
