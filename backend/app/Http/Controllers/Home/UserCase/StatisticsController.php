<?php

namespace App\Http\Controllers\Home\UserCase;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StatisticsController extends Controller
{
    public function employeeWorkloadSummary()
    {
        $results = DB::connection('pgsql_real')
            ->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->join('users as u', 'u.empCode', '=', 'ac.empCode')
            ->select(
                'ac.empCode',
                'u.name',
                DB::raw('COUNT(*) as total'),
                DB::raw('COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") <= 60) as within_1_min'),
                DB::raw('COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") > 60 AND EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") <= 300) as one_to_five_min'),
                DB::raw('COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") > 300 AND EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") <= 600) as five_to_ten_min'),
                DB::raw('COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") > 600) as over_ten_min')
            )
            ->where('r.status', 'success')
            ->whereDate('ac.endTime', today())
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->groupBy('ac.empCode', 'u.name')
            ->orderByDesc('total')
            ->get();

        $totalAll = $results->sum('total');

        foreach ($results as $row) {
            $row->percentage = round(($row->total / $totalAll) * 100, 2);

            $inProgress = DB::connection('pgsql_real')
                ->table('rates as r')
                ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
                ->where('ac.empCode', $row->empCode)
                ->where('r.status', 'progress')
                ->whereDate('r.updated_at', Carbon::today())
                ->count();

            $row->in_progress = $inProgress;
        }

        return response()->json([
            'data' => $results
        ]);
    }

    public function tagWorkloadSummary()
    {
        $today = Carbon::today();

        $results = DB::connection('pgsql_real')
            ->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->select(
                DB::raw('COALESCE(tm."tagName", \'ไม่ระบุแท็ก\') as tag'),
                DB::raw('COUNT(*) as total'),
                DB::raw('COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") > 60 AND EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") <= 300) as one_to_five_min'),
                DB::raw('COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") > 300 AND EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") <= 600) as five_to_ten_min'),
                DB::raw('COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") > 600) as over_ten_min')
            )
            ->where('r.status', 'success')
            ->whereDate('ac.endTime', $today)
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->groupBy(DB::raw('COALESCE(tm."tagName", \'ไม่ระบุแท็ก\')'))
            ->orderByDesc('total')
            ->get();

        $totalAll = $results->sum('total');

        foreach ($results as $row) {
            $row->percent = round(($row->total / $totalAll) * 100, 2);
        }

        return response()->json([
            'data' => $results
        ]);
    }

    public function getAllCasesByUser($empCode)
    {
        $today = Carbon::today();

        $cases = DB::connection('pgsql_real')
            ->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->selectRaw('
            ac.id as conversation_id,
            r.status as status_name,
            ac."startTime" as started_at,
            ac."receiveAt" as accepted_at,
            ac."endTime" as closed_at,
            ac."roomId" as room_id,
            ac."custId",
            COALESCE(NULLIF(c."custName", \'\'), ac."custId") as customer_name,
            COALESCE(tm."tagName", \'ไม่ระบุแท็ก\') as tag_name
        ')
            ->where('ac.empCode', $empCode)
            ->whereIn('r.status', ['success', 'cancelled', 'progress'])
            ->where(function ($q) {
                $today = now()->toDateString();
                $q->where(function ($q) use ($today) {
                    $q->whereIn('r.status', ['success', 'cancelled'])
                        ->whereDate('ac.endTime', $today);
                })->orWhere(function ($q) use ($today) {
                    $q->where('r.status', 'progress')
                        ->whereDate('r.updated_at', $today);
                });
            })
            ->orderByDesc(DB::raw('"ac"."startTime"'))
            ->get();

        return response()->json([
            'cases' => $cases,
        ]);
    }

    public function getAllCasesByTag($tagName)
    {
        $today = Carbon::today();

        $cases = DB::connection('pgsql_real')
            ->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->leftJoin('users as u', 'u.empCode', '=', 'ac.empCode')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->selectRaw('
            ac.id as conversation_id,
            r.status as status_name,
            ac."startTime" as started_at,
            ac."receiveAt" as accepted_at,
            ac."endTime" as closed_at,
            ac."roomId" as room_id,
            ac."custId",
            COALESCE(NULLIF(c."custName", \'\'), ac."custId") as customer_name,
            u.name as employee_name,
            COALESCE(tm."tagName", \'ไม่ระบุแท็ก\') as tag_name
        ')
            ->where(DB::raw('COALESCE(tm."tagName", \'ไม่ระบุแท็ก\')'), $tagName)
            ->where('r.status', 'success')
            ->whereDate('ac.endTime', $today)
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->orderByDesc(DB::raw('"ac"."startTime"'))
            ->get();

        return response()->json([
            'cases' => $cases,
        ]);
    }
}
