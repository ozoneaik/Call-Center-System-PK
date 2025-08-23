<?php

namespace App\Http\Controllers\Home\UserCase\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StatisticsController extends Controller
{
    private function applyPlatformFilter($q, $platformId)
    {
        if (!$platformId) return $q;

        return $q
            ->join('customers as c_pf', 'c_pf.custId', '=', 'ac.custId')
            ->join('platform_access_tokens as pat_pf', 'pat_pf.id', '=', 'c_pf.platformRef')
            ->where('pat_pf.id', $platformId);
    }

    public function optionsPlatforms()
    {
        $rows = DB::connection('pgsql_real')
            ->table('platform_access_tokens as pat')
            ->select('pat.id', 'pat.platform', 'pat.description')
            ->whereNotIn('pat.description', ['ChatBot', 'OZONEAIK'])
            ->orderBy('pat.platform', 'asc')
            ->orderBy('pat.description', 'asc')
            ->get()
            ->map(fn($r) => [
                'value' => $r->id,
                'label' => strtoupper((string)$r->platform) . ' - ' . (string)$r->description,
                'platform' => $r->platform,
                'description' => $r->description,
            ])
            ->values()
            ->toArray();

        return response()->json(['options' => $rows]);
    }

    public function optionsDepartments()
    {
        $rows = DB::connection('pgsql_real')
            ->table('users as u')
            ->whereNotIn('u.empCode', ['BOT', 'adminIT'])
            ->whereNotIn('u.description', ['อะไรเอ้่ย', 'สำหรับทดสอบ'])
            ->selectRaw('DISTINCT TRIM(u."description") AS description')
            ->whereRaw("NULLIF(TRIM(u.\"description\"), '') IS NOT NULL")
            ->orderBy('description', 'asc')
            ->pluck('description')
            ->map(fn($d) => ['value' => $d, 'label' => $d])
            ->values()
            ->toArray();

        return response()->json(['options' => $rows]);
    }

    public function optionsEmployees(Request $request)
    {
        $dept = $request->query('dept');
        $q = DB::connection('pgsql_real')->table('users')
            ->whereNotIn('empCode', ['BOT', 'adminIT'])
            ->select('empCode', 'name', 'description')
            ->whereRaw("NULLIF(TRIM(name), '') IS NOT NULL");
        if ($dept) $q->where('description', $dept);
        else $q->whereRaw("NULLIF(TRIM(description), '') IS NOT NULL");

        $rows = $q->orderBy('name', 'asc')->get()
            ->map(fn($r) => ['value' => $r->empCode, 'label' => $r->name, 'department' => trim((string)$r->description)]);
        return response()->json($rows);
    }

    private function applyPlatformFilterAlias($q, $platformId, $acAlias = 'ac')
    {
        if (!$platformId) return $q;

        return $q
            ->join("customers as c_pf_$acAlias", "c_pf_$acAlias.custId", '=', DB::raw("\"$acAlias\".\"custId\""))
            ->join("platform_access_tokens as pat_pf_$acAlias", "pat_pf_$acAlias.id", '=', "c_pf_$acAlias.platformRef")
            ->where("pat_pf_$acAlias.id", $platformId);
    }

    public function employeeWorkloadSummary(Request $request)
    {
        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $empCode    = $request->query('empCode');
        $today      = Carbon::today('Asia/Bangkok')->toDateString();

        $successAgg = DB::connection('pgsql_real')->table('rates as r_s')
            ->join('active_conversations as ac_s', 'ac_s.rateRef', '=', 'r_s.id')
            ->leftJoin('users as u_s', 'u_s.empCode', '=', 'ac_s.empCode')
            ->when($dept, fn($q) => $q->where('u_s.description', $dept))
            ->where('r_s.status', 'success')
            ->when($request->query('start_date') && $request->query('end_date'), function ($q) use ($request) {
                $start = Carbon::parse($request->query('start_date'))->startOfDay();
                $end   = Carbon::parse($request->query('end_date'))->endOfDay();
                return $q->whereBetween('ac_s.endTime', [$start, $end]);
            }, function ($q) use ($today) {
                return $q->whereDate('ac_s.endTime', $today);
            })
            ->whereNotIn('ac_s.empCode', ['BOT', 'adminIT']);

        $successAgg = $this->applyPlatformFilterAlias($successAgg, $platformId, 'ac_s');

        $successAgg = $successAgg
            ->groupBy('ac_s.empCode')
            ->selectRaw('
            ac_s."empCode" as "empCode",
            COUNT(*) as total_success,
            COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac_s."endTime" - ac_s."startTime") <= 60) as within_1_min,
            COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac_s."endTime" - ac_s."startTime") > 60 AND EXTRACT(EPOCH FROM ac_s."endTime" - ac_s."startTime") <= 300) as one_to_five_min,
            COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac_s."endTime" - ac_s."startTime") > 300 AND EXTRACT(EPOCH FROM ac_s."endTime" - ac_s."startTime") <= 600) as five_to_ten_min,
            COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac_s."endTime" - ac_s."startTime") > 600) as over_ten_min
        ');

        $progressAgg = DB::connection('pgsql_real')->table('rates as r_p')
            ->join('active_conversations as ac_p', 'ac_p.rateRef', '=', 'r_p.id')
            ->leftJoin('users as u_p', 'u_p.empCode', '=', 'ac_p.empCode')
            ->when($dept, fn($q) => $q->where('u_p.description', $dept))
            ->where('r_p.status', 'progress')
            ->when($request->query('start_date') && $request->query('end_date'), function ($q) use ($request) {
                $start = Carbon::parse($request->query('start_date'))->startOfDay();
                $end   = Carbon::parse($request->query('end_date'))->endOfDay();
                return $q->whereBetween('ac_p.receiveAt', [$start, $end]);
            }, function ($q) use ($today) {
                return $q->whereDate('ac_p.receiveAt', $today);
            })
            ->whereNotIn('ac_p.empCode', ['BOT', 'adminIT']);

        $progressAgg = $this->applyPlatformFilterAlias($progressAgg, $platformId, 'ac_p');

        $progressAgg = $progressAgg
            ->groupBy('ac_p.empCode')
            ->selectRaw('
            ac_p."empCode" as "empCode",
            COUNT(*) as in_progress
        ');

        $base = DB::connection('pgsql_real')->table('users as u')
            ->selectRaw('
            u."empCode",
            u."name",
            COALESCE(s.total_success, 0) as total,
            COALESCE(s.within_1_min, 0) as within_1_min,
            COALESCE(s.one_to_five_min, 0) as one_to_five_min,
            COALESCE(s.five_to_ten_min, 0) as five_to_ten_min,
            COALESCE(s.over_ten_min, 0) as over_ten_min,
            COALESCE(p.in_progress, 0) as in_progress
        ')
            ->leftJoinSub($successAgg, 's', 's.empCode', '=', 'u.empCode')
            ->leftJoinSub($progressAgg, 'p', 'p.empCode', '=', 'u.empCode')
            ->whereNotIn('u.empCode', ['BOT', 'adminIT'])
            ->when($dept, fn($q) => $q->where('u.description', $dept))
            ->when($empCode, fn($q) => $q->where('u.empCode', $empCode))
            ->whereRaw('NULLIF(TRIM(u."name"), \'\') IS NOT NULL');

        $rows = $base
            ->where(function ($q) {
                $q->whereRaw('COALESCE(s.total_success,0) > 0')
                    ->orWhereRaw('COALESCE(p.in_progress,0) > 0');
            })
            ->orderByDesc('total')
            ->orderByDesc('in_progress')
            ->get();

        $totalAllSuccess = $rows->sum('total');
        foreach ($rows as $row) {
            $row->percentage      = $totalAllSuccess ? round(($row->total / $totalAllSuccess) * 100, 2) : 0.0;
            $row->total           = (int) $row->total;
            $row->one_to_five_min = (int) $row->one_to_five_min;
            $row->five_to_ten_min = (int) $row->five_to_ten_min;
            $row->over_ten_min    = (int) $row->over_ten_min;
            $row->in_progress     = (int) $row->in_progress;
        }

        return response()->json(['data' => $rows]);
    }

    public function tagWorkloadSummary(Request $request)
    {
        $today = Carbon::today();
        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $empCode    = $request->query('empCode');

        $q = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->join('users as u', 'u.empCode', '=', 'ac.empCode')
            ->select(
                DB::raw('COALESCE(tm."tagName", \'ไม่ระบุแท็ก\') as tag'),
                DB::raw('COUNT(*) as total'),
                DB::raw('COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") > 60 AND EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") <= 300) as one_to_five_min'),
                DB::raw('COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") > 300 AND EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") <= 600) as five_to_ten_min'),
                DB::raw('COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") > 600) as over_ten_min')
            )
            ->where('r.status', 'success')
            ->when($request->query('start_date') && $request->query('end_date'), function ($q) use ($request) {
                $start = Carbon::parse($request->query('start_date'))->startOfDay();
                $end   = Carbon::parse($request->query('end_date'))->endOfDay();
                return $q->whereBetween('ac.endTime', [$start, $end]);
            }, function ($q) use ($today) {
                return $q->whereDate('ac.endTime', $today);
            })
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT']);

        if ($dept)    $q->where('u.description', $dept);
        if ($empCode) $q->where('ac.empCode', $empCode);
        $q = $this->applyPlatformFilter($q, $platformId);

        $results = $q->groupBy(DB::raw('COALESCE(tm."tagName", \'ไม่ระบุแท็ก\')'))->orderByDesc('total')->get();
        $totalAll = $results->sum('total');
        foreach ($results as $row) {
            $row->percent = $totalAll ? round(($row->total / $totalAll) * 100, 2) : 0.0;
        }
        return response()->json(['data' => $results]);
    }

    // public function getAllCasesByUser($empCode, Request $request)
    // {
    //     $platformId = $request->query('platform_id');
    //     $dept       = $request->query('dept');
    //     $today = Carbon::today();
    //     $statusesParam = $request->query('statuses'); 
    //     $statuses = $statusesParam
    //         ? array_values(array_filter(array_map('trim', explode(',', $statusesParam))))
    //         : ['success']; 

    //     $q = DB::connection('pgsql_real')->table('rates as r')
    //         ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
    //         ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
    //         ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
    //         ->leftJoin('users as u', 'u.empCode', '=', 'ac.empCode')
    //         ->selectRaw('
    //             ac.id as conversation_id,
    //             r.status as status_name,
    //             ac."startTime" as started_at,
    //             ac."receiveAt" as accepted_at,
    //             ac."endTime" as closed_at,
    //             ac."roomId" as room_id,
    //             ac."custId",
    //             COALESCE(NULLIF(c."custName", \'\'), ac."custId") as customer_name,
    //             COALESCE(tm."tagName", \'ไม่ระบุแท็ก\') as tag_name
    //         ')
    //         ->where('ac.empCode', $empCode)
    //         ->whereIn('r.status', $statuses)
    //         ->when($request->query('start_date') && $request->query('end_date'), function ($q2) use ($request, $statuses) {
    //             $start = Carbon::parse($request->query('start_date'))->startOfDay();
    //             $end   = Carbon::parse($request->query('end_date'))->endOfDay();
    //             $q2->where(function ($q3) use ($start, $end, $statuses) {
    //                 $sc = array_values(array_intersect($statuses, ['success', 'cancelled']));
    //                 if (!empty($sc)) {
    //                     $q3->orWhere(function ($qq) use ($start, $end, $sc) {
    //                         $qq->whereIn('r.status', $sc)->whereBetween('ac.endTime', [$start, $end]);
    //                     });
    //                 }
    //                 if (in_array('progress', $statuses, true)) {
    //                     $q3->orWhere(function ($qq) use ($start, $end) {
    //                         $qq->where('r.status', 'progress')->whereBetween('ac.receiveAt', [$start, $end]);
    //                     });
    //                 }
    //             });
    //         }, function ($q2) use ($statuses) {
    //             $today = now()->toDateString();
    //             $q2->where(function ($q3) use ($today, $statuses) {
    //                 $sc = array_values(array_intersect($statuses, ['success', 'cancelled']));
    //                 if (!empty($sc)) {
    //                     $q3->orWhere(function ($qq) use ($today, $sc) {
    //                         $qq->whereIn('r.status', $sc)->whereDate('ac.endTime', $today);
    //                     });
    //                 }
    //                 if (in_array('progress', $statuses, true)) {
    //                     $q3->orWhere(function ($qq) use ($today) {
    //                         $qq->where('r.status', 'progress')->whereDate('r.updated_at', $today);
    //                     });
    //                 }
    //             });
    //         });
    //     if ($dept) $q->where('u.description', $dept);
    //     $q = $this->applyPlatformFilter($q, $platformId);

    //     $cases = $q->orderByDesc(DB::raw('"ac"."startTime"'))->get();
    //     return response()->json(['cases' => $cases]);
    // }

    public function getAllCasesByUser($empCode, Request $request)
    {
        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');

        $statusesParam = $request->query('statuses');
        $statuses = $statusesParam
            ? array_values(array_filter(array_map('trim', explode(',', $statusesParam))))
            : ['success'];

        $todayTz = Carbon::today('Asia/Bangkok')->toDateString();
        $hasRange = $request->query('start_date') && $request->query('end_date');
        $start = $hasRange ? Carbon::parse($request->query('start_date'))->startOfDay() : null;
        $end   = $hasRange ? Carbon::parse($request->query('end_date'))->endOfDay()   : null;

        $q = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->leftJoin('users as u', 'u.empCode', '=', 'ac.empCode')
            ->where('ac.empCode', $empCode)
            ->whereIn('r.status', $statuses)
            ->selectRaw('
            ac.id as conversation_id,
            r.status as status_name,
            ac."startTime" as started_at,
            ac."receiveAt" as accepted_at,
            ac."endTime"   as closed_at,
            ac."roomId"    as room_id,
            ac."custId",
            COALESCE(NULLIF(c."custName", \'\'), ac."custId") as customer_name,
            COALESCE(tm."tagName", \'ไม่ระบุแท็ก\') as tag_name
        ')
            ->when($dept, fn($qq) => $qq->where('u.description', $dept));

        $q = $this->applyPlatformFilterAlias($q, $platformId, 'ac');
        if ($hasRange) {
            $q->where(function ($qq) use ($statuses, $start, $end) {
                $sc = array_values(array_intersect($statuses, ['success', 'cancelled']));
                if (!empty($sc)) {
                    $qq->where(function ($q2) use ($start, $end, $sc) {
                        $q2->whereIn('r.status', $sc)->whereBetween('ac.endTime', [$start, $end]);
                    });
                }
                if (in_array('progress', $statuses, true)) {
                    $qq->orWhere(function ($q2) use ($start, $end) {
                        $q2->where('r.status', 'progress')->whereBetween('ac.receiveAt', [$start, $end]);
                    });
                }
            });
        } else {
            $q->where(function ($qq) use ($statuses, $todayTz) {
                $sc = array_values(array_intersect($statuses, ['success', 'cancelled']));
                if (!empty($sc)) {
                    $qq->where(function ($q2) use ($todayTz, $sc) {
                        $q2->whereIn('r.status', $sc)->whereDate('ac.endTime', $todayTz);
                    });
                }
                if (in_array('progress', $statuses, true)) {
                    $qq->orWhere(function ($q2) use ($todayTz) {
                        $q2->where('r.status', 'progress')->whereDate('ac.receiveAt', $todayTz);
                    });
                }
            });
        }
        $cases = $q->distinct()
            ->orderByDesc(DB::raw('"ac"."startTime"'))
            ->get();

        return response()->json(['cases' => $cases]);
    }

    public function getAllCasesByTag($tagName, Request $request)
    {
        $today = Carbon::today();
        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $empCode    = $request->query('empCode');

        $q = DB::connection('pgsql_real')->table('rates as r')
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
            ->when($request->query('start_date') && $request->query('end_date'), function ($q) use ($request) {
                $start = Carbon::parse($request->query('start_date'))->startOfDay();
                $end   = Carbon::parse($request->query('end_date'))->endOfDay();
                return $q->whereBetween('ac.endTime', [$start, $end]);
            }, function ($q) use ($today) {
                return $q->whereDate('ac.endTime', $today);
            })
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT']);
        if ($dept)    $q->where('u.description', $dept);
        if ($empCode) $q->where('ac.empCode', $empCode);
        $q = $this->applyPlatformFilter($q, $platformId);

        $cases = $q->orderByDesc(DB::raw('"ac"."startTime"'))->get();
        return response()->json(['cases' => $cases]);
    }
}
