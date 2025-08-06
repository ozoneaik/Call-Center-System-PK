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
            ->whereDate('r.updated_at', $today)   // เวลาอัปเดตของ rate = เวลาปิดเคส
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
            ->whereDate('r.updated_at', $today)   // เวลาอัปเดตของ rate = เวลาปิดเคส
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
            ->whereBetween('r.updated_at', [$start, $end])
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
            ->whereBetween('r.updated_at', [$start, $end])
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

    /**
     * 🔧 ใช้ซ้ำ: query สรุปแท็กในช่วงวันที่ โดยระบุ empCode (บังคับ)
     */
    private function tagSummaryByUserRange($start, $end, string $empCode)
    {
        return DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->whereBetween('r.updated_at', [$start, $end])
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
            ->whereBetween('r.updated_at', [$start, $end])
            ->where('r.status', 'success')
            ->where('ac.empCode', $empCode)
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->selectRaw('
            ac.id as conversation_id,
            r.updated_at as closed_at,
            COALESCE(NULLIF(c."custName", \'\'), ac."custId") as customer_name, 
            COALESCE(tm."tagName", \'ไม่ระบุแท็ก\') as tag_name
        ')
            ->orderByDesc('r.updated_at')
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
            ->whereBetween('r.updated_at', [$start, $end])
            ->where('r.status', 'success')
            ->where('ac.empCode', $empCode)
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->selectRaw('
            ac.id as conversation_id,
            r.updated_at as closed_at,
            COALESCE(NULLIF(c."custName", \'\'), ac."custId") as customer_name,
            COALESCE(tm."tagName", \'ไม่ระบุแท็ก\') as tag_name
        ')
            ->orderByDesc('r.updated_at')
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
            ->whereBetween('r.updated_at', [$start, $end])
            ->where('r.status', 'success')
            ->where('ac.empCode', $empCode)
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->selectRaw('
            ac.id as conversation_id,
            r.updated_at as closed_at,
            COALESCE(NULLIF(c."custName", \'\'), ac."custId") as customer_name,
            COALESCE(tm."tagName", \'ไม่ระบุแท็ก\') as tag_name
        ')
            ->orderByDesc('r.updated_at')
            ->get();

        return response()->json([
            'range'   => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'empCode' => $empCode,
            'total'   => $rows->count(),
            'cases'   => $rows,
        ]);
    }
}
