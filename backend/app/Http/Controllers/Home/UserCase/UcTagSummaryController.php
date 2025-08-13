<?php

namespace App\Http\Controllers\Home\UserCase;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class UcTagSummaryController extends Controller
{
    // ดึงรายการแท็กทั้งหมด
    public function tags()
    {
        $rows = DB::connection('pgsql_real')->table('tag_menus')
            ->select('id', 'tagName')
            ->orderBy('tagName', 'asc')
            ->get();

        return response()->json([
            'tags' => $rows,
        ]);
    }

    // ==== ของเดิม (สรุปแท็กวันนี้/สัปดาห์/เดือน) ยังใช้ได้เหมือนเดิม ====
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
        $today = Carbon::today();

        $rows = DB::connection('pgsql_real')->table('rates as r')
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
            'tags' => $rows,
        ]);
    }

    public function weekClosedTags()
    {
        $start = Carbon::now()->startOfWeek();
        $end   = Carbon::now()->endOfWeek();

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
            'range' => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'tags'  => $rows,
        ]);
    }

    public function monthClosedTags()
    {
        $start = Carbon::now()->startOfMonth();
        $end   = Carbon::now()->endOfMonth();

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
            'range' => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'tags'  => $rows,
        ]);
    }

    // ===== รายการปิดเคสของ user (รองรับหลายแท็ก) =====
    public function closedTodayByUser(Request $request, string $empCode)
    {
        $start = Carbon::today()->startOfDay();
        $end   = Carbon::today()->endOfDay();

        $tagIds = $request->query('tag_ids', []);
        if (is_string($tagIds)) {
            $tagIds = array_filter(explode(',', $tagIds));
        }

        $rows = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->whereBetween('ac.endTime', [$start, $end])
            ->where('r.status', 'success')
            ->where('ac.empCode', $empCode)
            ->when(!empty($tagIds), fn($q) => $q->whereIn('r.tag', $tagIds))
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

    public function closedThisWeekByUser(Request $request, string $empCode)
    {
        $start = Carbon::now()->startOfWeek();
        $end   = Carbon::now()->endOfWeek();

        $tagIds = $request->query('tag_ids', []);
        if (is_string($tagIds)) {
            $tagIds = array_filter(explode(',', $tagIds));
        }

        $rows = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->whereBetween('ac.endTime', [$start, $end])
            ->where('r.status', 'success')
            ->where('ac.empCode', $empCode)
            ->when(!empty($tagIds), fn($q) => $q->whereIn('r.tag', $tagIds))
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

    public function closedMonthByUser(Request $request, string $empCode)
    {
        $start = Carbon::now()->startOfMonth();
        $end   = Carbon::now()->endOfMonth();

        $tagIds = $request->query('tag_ids', []);
        if (is_string($tagIds)) {
            $tagIds = array_filter(explode(',', $tagIds));
        }

        $rows = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->whereBetween('ac.endTime', [$start, $end])
            ->where('r.status', 'success')
            ->where('ac.empCode', $empCode)
            ->when(!empty($tagIds), fn($q) => $q->whereIn('r.tag', $tagIds))
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

    // โหมดช่วงวันแบบยืดหยุ่น (ใช้กับหน้า/โมดอลเมื่อเลือกช่วง)
    public function closedRange(Request $request, $empCode)
    {
        $start = $request->query('start_date');
        $end   = $request->query('end_date', $start);

        $tagIds = $request->query('tag_ids', []);
        if (is_string($tagIds)) {
            $tagIds = array_filter(explode(',', $tagIds));
        }

        $rows = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->where('ac.empCode', $empCode)
            ->whereBetween(DB::raw('ac."endTime"::date'), [$start, $end])
            ->where('r.status', 'success')
            ->when(!empty($tagIds), fn($q) => $q->whereIn('r.tag', $tagIds))
            ->select(
                'ac.id as conversation_id',
                'ac.endTime as closed_at',
                'ac.custId',
                DB::raw('COALESCE(NULLIF(c."custName", \'\'), ac."custId") as customer_name'),
                DB::raw('COALESCE(tm."tagName", \'ไม่ระบุแท็ก\') as tag_name')
            )
            ->orderBy('ac.endTime', 'desc')
            ->get();

        return response()->json([
            'range' => ['start' => $start, 'end' => $end],
            'cases' => $rows
        ]);
    }

    // ====== ของเดิมอื่น ๆ ======
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

    // ✅ เพิ่ม: ส่งต่อเคส "วันนี้"
    public function forwardedTodayByUser(string $empCode)
    {
        $start = Carbon::today()->startOfDay();
        $end   = Carbon::today()->endOfDay();

        $rows = DB::connection('pgsql_real')->table('active_conversations as ac')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->leftJoin('chat_rooms as cr', 'cr.roomId', '=', 'ac.roomId')
            ->where('ac.from_empCode', $empCode)
            ->whereNotNull('ac.from_empCode')
            ->whereBetween('ac.updated_at', [$start, $end])
            ->select(
                'ac.id as conversation_id',
                DB::raw('COALESCE(NULLIF(c."custName", \'\'), ac."custId") as customer_name'),
                'ac.roomId as forwarded_to_room',
                'cr.roomName as forwarded_room_name',
                'ac.updated_at as forwarded_time'
            )
            ->orderByDesc('ac.updated_at')
            ->get();

        return response()->json([
            'range' => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'empCode' => $empCode,
            'total' => $rows->count(),
            'cases' => $rows,
        ]);
    }

    // ✅ เพิ่ม: ส่งต่อเคส "ตามช่วงวันที่"
    public function forwardedRangeByUser(Request $request, string $empCode)
    {
        $start = $request->query('start_date');
        $end   = $request->query('end_date', $start);

        if (!$start) {
            return response()->json([
                'message' => 'start_date is required'
            ], 422);
        }

        $rows = DB::connection('pgsql_real')->table('active_conversations as ac')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->leftJoin('chat_rooms as cr', 'cr.roomId', '=', 'ac.roomId')
            ->where('ac.from_empCode', $empCode)
            ->whereNotNull('ac.from_empCode')
            ->whereBetween(DB::raw('ac."updated_at"::date'), [$start, $end])
            ->select(
                'ac.id as conversation_id',
                DB::raw('COALESCE(NULLIF(c."custName", \'\'), ac."custId") as customer_name'),
                'ac.roomId as forwarded_to_room',
                'cr.roomName as forwarded_room_name',
                'ac.updated_at as forwarded_time'
            )
            ->orderByDesc('ac.updated_at')
            ->get();

        return response()->json([
            'range' => ['start' => $start, 'end' => $end],
            'empCode' => $empCode,
            'total' => $rows->count(),
            'cases' => $rows,
        ]);
    }

    // ของเดิม: ส่งต่อเคสทั้งหมด (ไม่กรองวัน)
    public function forwardedByUser(string $empCode)
    {
        $rows = DB::connection('pgsql_real')->table('active_conversations as ac')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->leftJoin('chat_rooms as cr', 'cr.roomId', '=', 'ac.roomId')
            ->where('ac.from_empCode', $empCode)
            ->whereNotNull('ac.from_empCode')
            ->select(
                'ac.id as conversation_id',
                DB::raw('COALESCE(NULLIF(c."custName", \'\'), ac."custId") as customer_name'),
                'ac.roomId as forwarded_to_room',
                'cr.roomName as forwarded_room_name',
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
