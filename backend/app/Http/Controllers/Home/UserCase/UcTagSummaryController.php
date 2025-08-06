<?php

namespace App\Http\Controllers\Home\UserCase;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class UcTagSummaryController extends Controller
{
    //
    public function tagSummaryToday()
    {
        $today = Carbon::today();

        $results = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->whereDate('ac.endTime', $today)
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->selectRaw('COALESCE(tm."tagName", \'ไม่ระบุแท็ก\') AS tag_name, COUNT(*) AS total')
            ->groupBy(DB::raw('COALESCE(tm."tagName", \'ไม่ระบุแท็ก\')'))
            ->orderByDesc('total')
            ->get();

        return response()->json([
            'date' => $today->toDateString(),
            'data' => $results,
        ]);
    }

    public function todayClosedTags()
    {
        $today = \Carbon\Carbon::today();

        $rows = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->whereDate('ac.endTime', $today)   // เวลาอัปเดตของ rate = เวลาปิดเคส
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->selectRaw('COALESCE(tm."tagName", \'ไม่ระบุแท็ก\') AS tag_name, COUNT(*) AS total')
            ->groupBy(DB::raw('COALESCE(tm."tagName", \'ไม่ระบุแท็ก\')'))
            ->orderByDesc('total')
            ->get();

        return response()->json([
            'date' => $today->toDateString(),
            'tags' => $rows,
        ]);
    }

    public function weekClosedTags()
    {
        $start = \Carbon\Carbon::now()->startOfWeek();
        $end = \Carbon\Carbon::now()->endOfWeek();

        $rows = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->whereBetween('ac.endTime', [$start, $end])
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->selectRaw('COALESCE(tm."tagName", \'ไม่ระบุแท็ก\') AS tag_name, COUNT(*) AS total')
            ->groupBy(DB::raw('COALESCE(tm."tagName", \'ไม่ระบุแท็ก\')'))
            ->orderByDesc('total')
            ->get();

        return response()->json([
            'range' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString()
            ],
            'tags' => $rows,
        ]);
    }

    public function monthClosedTags()
    {
        $start = \Carbon\Carbon::now()->startOfMonth();
        $end = \Carbon\Carbon::now()->endOfMonth();

        $rows = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->whereBetween('ac.endTime', [$start, $end])
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->selectRaw('COALESCE(tm."tagName", \'ไม่ระบุแท็ก\') AS tag_name, COUNT(*) AS total')
            ->groupBy(DB::raw('COALESCE(tm."tagName", \'ไม่ระบุแท็ก\')'))
            ->orderByDesc('total')
            ->get();

        return response()->json([
            'range' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString()
            ],
            'tags' => $rows,
        ]);
    }

    private function tagSummaryByUserRange($start, $end, string $empCode)
    {
        return DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->whereBetween('ac.endTime', [$start, $end])
            ->where('r.status', 'success')
            ->where('ac.empCode', $empCode)
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->selectRaw('COALESCE(tm."tagName", \'ไม่ระบุแท็ก\') AS tag_name, COUNT(*) AS total')
            ->groupBy(DB::raw('COALESCE(tm."tagName", \'ไม่ระบุแท็ก\')'))
            ->orderByDesc('total');
    }

    public function todayClosedTagsByUser(string $empCode)
    {
        $start = Carbon::today()->startOfDay();
        $end   = Carbon::today()->endOfDay();

        $rows = $this->tagSummaryByUserRange($start, $end, $empCode)->get();

        return response()->json([
            'date'    => $start->toDateString(),
            'empCode' => $empCode,
            'tags'    => $rows,
        ]);
    }

    public function weekClosedTagsByUser(string $empCode)
    {
        $start = Carbon::now()->startOfWeek();
        $end   = Carbon::now()->endOfWeek();

        $rows = $this->tagSummaryByUserRange($start, $end, $empCode)->get();

        return response()->json([
            'range'   => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'empCode' => $empCode,
            'tags'    => $rows,
        ]);
    }

    public function monthClosedTagsByUser(string $empCode)
    {
        $start = Carbon::now()->startOfMonth();
        $end   = Carbon::now()->endOfMonth();

        $rows = $this->tagSummaryByUserRange($start, $end, $empCode)->get();

        return response()->json([
            'range'   => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'empCode' => $empCode,
            'tags'    => $rows,
        ]);
    }

    public function closedTodayByUser(string $empCode)
    {
        $start = \Carbon\Carbon::today()->startOfDay();
        $end   = \Carbon\Carbon::today()->endOfDay();

        $rows = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->whereBetween('ac.endTime', [$start, $end])
            ->where('r.status', 'success')
            ->where('ac.empCode', $empCode)
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->selectRaw('
            ac.id as conversation_id,
            "ac"."endTime" as closed_at,
            ac."custId",
            COALESCE(NULLIF(c."custName", \'\'), ac."custId") as customer_name, 
            COALESCE(tm."tagName", \'ไม่ระบุแท็ก\') as tag_name
        ')
            ->orderByDesc(DB::raw('"ac"."endTime"'))
            ->get();

        return response()->json([
            'date'    => $start->toDateString(),
            'empCode' => $empCode,
            'total'   => $rows->count(),
            'cases'   => $rows,
        ]);
    }

    public function closedThisWeekByUser(string $empCode)
    {
        $start = \Carbon\Carbon::now()->startOfWeek();
        $end   = \Carbon\Carbon::now()->endOfWeek();

        $rows = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->whereBetween('ac.endTime', [$start, $end])
            ->where('r.status', 'success')
            ->where('ac.empCode', $empCode)
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->selectRaw('
            ac.id as conversation_id,
            "ac"."endTime" as closed_at,
            COALESCE(NULLIF(c."custName", \'\'), ac."custId") as customer_name,
            COALESCE(tm."tagName", \'ไม่ระบุแท็ก\') as tag_name
        ')
            ->orderByDesc(DB::raw('"ac"."endTime"'))
            ->get();

        return response()->json([
            'range' => [
                'start' => $start->toDateString(),
                'end'   => $end->toDateString()
            ],
            'empCode' => $empCode,
            'total'   => $rows->count(),
            'cases'   => $rows,
        ]);
    }

    public function closedMonthByUser($empCode)
    {
        $start = \Carbon\Carbon::now()->startOfMonth();
        $end = \Carbon\Carbon::now()->endOfMonth();

        $rows = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->whereBetween('ac.endTime', [$start, $end])
            ->where('r.status', 'success')
            ->where('ac.empCode', $empCode)
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->selectRaw('
            ac.id as conversation_id,
            "ac"."endTime" as closed_at,
            COALESCE(NULLIF(c."custName", \'\'), ac."custId") as customer_name,
            COALESCE(tm."tagName", \'ไม่ระบุแท็ก\') as tag_name
        ')
            ->orderByDesc(DB::raw('"ac"."endTime"'))
            ->get();

        return response()->json([
            'range'   => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'empCode' => $empCode,
            'total'   => $rows->count(),
            'cases'   => $rows,
        ]);
    }

    public function inProgressByUser(string $empCode)
    {
        $today = Carbon::today();

        $rows = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('customers as c', 'ac.custId', '=', 'c.custId')
            ->leftJoin('chat_rooms as cr', 'cr.roomId', '=', 'ac.roomId')
            ->whereDate('r.updated_at', $today)
            ->where('r.status', 'progress')
            ->where('ac.empCode', $empCode)
            ->select(
                'ac.id as conversation_id',
                DB::raw('COALESCE(NULLIF(c."custName", \'\'), ac."custId") as customer_name'),
                'ac.roomId as room_id',
                'cr.roomName as inprogress_room_name',
                'ac.startTime as started_at'
            )
            ->orderByDesc('ac.startTime')
            ->get();

        return response()->json([
            'empCode' => $empCode,
            'total' => $rows->count(),
            'cases' => $rows,
        ]);
    }

    public function forwardedByUser(string $empCode)
    {
        $rows = DB::connection('pgsql_real')->table('active_conversations as ac')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->leftJoin('chat_rooms as cr', 'cr.roomId', '=', 'ac.roomId') // ✅ เพิ่มเพื่อดึงชื่อห้อง
            ->where('ac.from_empCode', $empCode)
            ->whereNotNull('ac.from_empCode')
            ->select(
                'ac.id as conversation_id',
                DB::raw('COALESCE(NULLIF(c."custName", \'\'), ac."custId") as customer_name'),
                'ac.roomId as forwarded_to_room',
                'cr.roomName as forwarded_room_name', // ✅ ดึงชื่อห้อง
                'ac.updated_at as forwarded_time'
            )
            ->orderByDesc('ac.updated_at')
            ->get();

        return response()->json([
            'empCode' => $empCode,
            'total' => $rows->count(),
            'cases' => $rows,
        ]);
    }
}
