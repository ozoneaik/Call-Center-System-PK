<?php

namespace App\Http\Controllers\Home\UserCase;

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

    public function employeeWorkloadSummary(Request $request)
    {
        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $empCode    = $request->query('empCode');

        $q = DB::connection('pgsql_real')->table('rates as r')
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
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT']);

        if ($dept)    $q->where('u.description', $dept);
        if ($empCode) $q->where('ac.empCode', $empCode);
        $q = $this->applyPlatformFilter($q, $platformId);

        $results = $q->groupBy('ac.empCode', 'u.name')->orderByDesc('total')->get();
        $totalAll = $results->sum('total');

        foreach ($results as $row) {
            $row->percentage = $totalAll ? round(($row->total / $totalAll) * 100, 2) : 0.0;

            $inProgress = DB::connection('pgsql_real')->table('rates as r')
                ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
                ->join('users as u', 'u.empCode', '=', 'ac.empCode')
                ->where('r.status', 'progress')
                ->where('ac.empCode', $row->empCode)
                ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
                ->whereDate('ac.receiveAt', Carbon::today());

            if ($dept) $inProgress->where('u.description', $dept);
            $inProgress = $this->applyPlatformFilter($inProgress, $platformId);

            $row->in_progress = (int) $inProgress->count();
        }
        return response()->json(['data' => $results]);
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
            ->whereDate('ac.endTime', $today)
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

    public function getAllCasesByUser($empCode, Request $request)
    {
        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $today = Carbon::today();

        $q = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->leftJoin('customers as c', 'c.custId', '=', 'ac.custId')
            ->leftJoin('tag_menus as tm', 'r.tag', '=', 'tm.id')
            ->leftJoin('users as u', 'u.empCode', '=', 'ac.empCode')
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
            ->where(function ($q2) {
                $today = now()->toDateString();
                $q2->where(function ($q3) use ($today) {
                    $q3->whereIn('r.status', ['success', 'cancelled'])->whereDate('ac.endTime', $today);
                })->orWhere(function ($q3) use ($today) {
                    $q3->where('r.status', 'progress')->whereDate('r.updated_at', $today);
                });
            });
        if ($dept) $q->where('u.description', $dept);
        $q = $this->applyPlatformFilter($q, $platformId);

        $cases = $q->orderByDesc(DB::raw('"ac"."startTime"'))->get();
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
            ->whereDate('ac.endTime', $today)
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT']);
        if ($dept)    $q->where('u.description', $dept);
        if ($empCode) $q->where('ac.empCode', $empCode);
        $q = $this->applyPlatformFilter($q, $platformId);

        $cases = $q->orderByDesc(DB::raw('"ac"."startTime"'))->get();
        return response()->json(['cases' => $cases]);
    }
}
