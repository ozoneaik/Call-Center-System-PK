<?php

namespace App\Http\Controllers\Home\UserCase;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class UcClosureStatsController extends Controller
{
    /* ========================= Shared helpers ========================= */

    private function applyPlatformFilter($q, $platformId)
    {
        if (!$platformId) return $q;

        return $q
            ->join('customers as c_pf', 'c_pf.custId', '=', 'ac.custId')
            ->join('platform_access_tokens as pat_pf', 'pat_pf.id', '=', 'c_pf.platformRef')
            ->where('pat_pf.id', $platformId);
    }

    private function applyUserFilters($q, $dept, $empCode)
    {
        if ($dept) {
            $q->join('users as u_f', 'u_f.empCode', '=', 'ac.empCode')
                ->where('u_f.description', $dept);
        }
        if ($empCode) {
            $q->where('ac.empCode', $empCode);
        }
        return $q;
    }

    private function durationSelectRaw(): string
    {
        return '
            COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") <= 60)  AS within_1_min,
            COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") > 60
                             AND EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") <= 300) AS one_to_five_min,
            COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") > 300
                             AND EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") <= 600) AS five_to_ten_min,
            COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") > 600) AS over_ten_min,
            COUNT(*) AS total
        ';
    }

    private function bucketLabels(): array
    {
        return [
            'within_1_min'     => '⏱ ภายใน 1 นาที',
            'one_to_five_min'  => '🕐 1-5 นาที',
            'five_to_ten_min'  => '🕒 5-10 นาที',
            'over_ten_min'     => '⏰ มากกว่า 10 นาที',
        ];
    }

    /** แปลงผลรวม in/out → array ตามที่ frontend ใช้ */
    private function buildDurationBuckets(?object $in, ?object $out): array
    {
        $labels = $this->bucketLabels();
        $data   = [];
        foreach ($labels as $key => $label) {
            $inVal  = (int)($in->$key  ?? 0);
            $outVal = (int)($out->$key ?? 0);
            $data[] = [
                'label'      => $label,
                'in_time'    => $inVal,
                'out_time'   => $outVal,
                'total_case' => $inVal + $outVal
            ];
        }
        return $data;
    }

    /** เวลาเริ่มทำงาน: ถ้ามี receiveAt ใช้ receiveAt ไม่งั้นใช้ startTime */
    private function startExpr(): string
    {
        return 'COALESCE(ac."receiveAt", ac."startTime")';
    }

    /** ในเวลาทำการ: 08:00–17:00 และไม่ใช่อาทิตย์ */
    private function applyInHours($q, string $col)
    {
        return $q->whereRaw("$col::time BETWEEN '08:00:00' AND '17:00:00'")
            ->whereRaw("EXTRACT(DOW FROM $col)::int <> 0");
    }

    /** นอกเวลาทำการ: ก่อน 08:00 หรือ หลัง 17:00 หรือเป็นวันอาทิตย์ทั้งวัน */
    private function applyOutHours($q, string $col)
    {
        return $q->where(function ($qq) use ($col) {
            $qq->whereRaw("$col::time < '08:00:00'")
                ->orWhereRaw("$col::time > '17:00:00'")
                ->orWhereRaw("EXTRACT(DOW FROM $col)::int = 0");
        });
    }

    /* ========================= End helpers ========================= */

    public function closureStats(Request $request)
    {
        $date       = $request->input('date') ?? Carbon::today()->toDateString();
        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $empCode    = $request->query('empCode');

        $current      = Carbon::parse($date);
        $previousDay  = $current->copy()->subDay();
        $previousWeek = $current->copy()->subWeek();

        $col = $this->startExpr(); // ใช้แยกใน/นอกเวลา

        $fetch = function (Carbon $d) use ($platformId, $dept, $empCode, $col) {

            // === ในเวลา: ปิดวันนี้ + เริ่มงานอยู่ในช่วงเวลาในทำการ
            $in = DB::connection("pgsql_real")->table('rates as r')
                ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
                ->where('r.status', 'success')
                ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
                ->whereDate('ac.endTime', $d->toDateString());
            $in = $this->applyUserFilters($in, $dept, $empCode);
            $in = $this->applyPlatformFilter($in, $platformId);
            $in = $this->applyInHours($in, $col)
                ->selectRaw($this->durationSelectRaw())
                ->first();

            // === นอกเวลา: ปิดวันนี้ + เริ่มงานอยู่นอกเวลาทำการ/อาทิตย์
            $out = DB::connection("pgsql_real")->table('rates as r')
                ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
                ->where('r.status', 'success')
                ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
                ->whereDate('ac.endTime', $d->toDateString());
            $out = $this->applyUserFilters($out, $dept, $empCode);
            $out = $this->applyPlatformFilter($out, $platformId);
            $out = $this->applyOutHours($out, $col)
                ->selectRaw($this->durationSelectRaw())
                ->first();

            return [
                'date'    => $d->toDateString(),
                'buckets' => $this->buildDurationBuckets($in, $out),
            ];
        };

        $curr     = $fetch($current);
        $prevDay  = $fetch($previousDay);
        $prevWeek = $fetch($previousWeek);

        return response()->json([
            'date'    => $current->toDateString(),
            'current' => $curr['buckets'],
            'compare' => [
                'previous_day'  => $prevDay['buckets'],
                'previous_week' => $prevWeek['buckets'],
            ],
        ]);
    }

    public function closureRangeStats(Request $request)
    {
        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $empCode    = $request->query('empCode');

        $start      = Carbon::parse($request->input('start_date'))->startOfDay();
        $end        = Carbon::parse($request->input('end_date'))->endOfDay();

        $filterCol = 'ac."endTime"';

        $startCol  = $this->startExpr(); // COALESCE(receiveAt, startTime)

        $inRows = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->whereBetween(DB::raw($filterCol), [$start, $end]);

        $inRows = $this->applyUserFilters($inRows, $dept, $empCode);
        $inRows = $this->applyPlatformFilter($inRows, $platformId);

        $inRows = $this->applyInHours($inRows, $startCol) // แยก in โดยดูจากเวลาเริ่ม
            ->selectRaw("DATE($filterCol) as date, " . $this->durationSelectRaw())
            ->groupBy(DB::raw("DATE($filterCol)"))
            ->orderBy(DB::raw("DATE($filterCol)"))
            ->get()
            ->keyBy('date');

        $outRows = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->whereBetween(DB::raw($filterCol), [$start, $end]);

        $outRows = $this->applyUserFilters($outRows, $dept, $empCode);
        $outRows = $this->applyPlatformFilter($outRows, $platformId);

        $outRows = $this->applyOutHours($outRows, $startCol)
            ->selectRaw("DATE($filterCol) as date, " . $this->durationSelectRaw())
            ->groupBy(DB::raw("DATE($filterCol)"))
            ->orderBy(DB::raw("DATE($filterCol)"))
            ->get()
            ->keyBy('date');

        $cursor  = $start->copy();
        $payload = [];
        while ($cursor->lte($end)) {
            $d = $cursor->toDateString();
            $buckets = $this->buildDurationBuckets($inRows->get($d), $outRows->get($d));
            $payload[] = ['date' => $d, 'buckets' => $buckets];
            $cursor->addDay();
        }

        return response()->json([
            'range' => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'data'  => $payload,
        ]);
    }

    public function afterHourClosureRangeStats(Request $request)
    {
        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $empCode    = $request->query('empCode');

        $start      = Carbon::parse($request->input('start_date'))->startOfDay();
        $end        = Carbon::parse($request->input('end_date'))->endOfDay();

        $filterCol = 'ac."endTime"';
        $startCol  = $this->startExpr();

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

    public function inProgressByBusinessHours(Request $request)
    {
        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $empCode    = $request->query('empCode');

        $col = 'ac."receiveAt"';

        $row = DB::connection('pgsql_real')->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->where('r.status', 'progress')
            ->whereDate('ac.receiveAt', Carbon::today())
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT']);

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

    public function pendingToday(Request $request)
    {
        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $empCode    = $request->query('empCode');

        $q = DB::connection('pgsql_real')->table('rates as r')
            ->where('r.status', 'pending')
            ->whereDate('r.created_at', Carbon::today())
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id');

        if ($dept) {
            $q = $q->join('users as u_p', 'u_p.empCode', '=', 'ac.empCode')
                ->where('u_p.description', $dept);
        }
        if ($empCode) {
            $q->where('ac.empCode', $empCode);
        }
        if ($platformId) {
            $q = $q->join('customers as c_pf', 'c_pf.custId', '=', 'ac.custId')
                ->join('platform_access_tokens as pat_pf', 'pat_pf.id', '=', 'c_pf.platformRef')
                ->where('pat_pf.id', $platformId);
        }

        $total = $q->count();

        return response()->json(['total' => (int)$total]);
    }

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

        $startExpr = $this->startExpr();
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

        if (!empty($dept)) {
            $q->where('u.description', $dept);
        }
        if (!empty($empCode)) {
            $q->where('ac.empCode', $empCode);
        }

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
            ac.id                                 AS conversation_id,
            r.id                                  AS rate_id,
            ac."custId",
            COALESCE(NULLIF(c."custName", \'\'), ac."custId") AS customer_name,
            ac."roomId",
            cr."roomName",
            ac."empCode",
            u.name                                AS employee_name,
            ac."from_empCode",
            tm."tagName"                          AS tag_name,
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
            END                                   AS duration_bucket
        ')
            ->orderBy('ac.endTime', 'desc')
            ->offset($offset)
            ->limit($perPage)
            ->get();

        return response()->json([
            'range' => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'filters' => [
                'platform_id' => $platformId,
                'dept'        => $dept,
                'empCode'     => $empCode,
                'bucket'      => $bucket,
            ],
            'pagination' => [
                'page'     => $page,
                'per_page' => $perPage,
                'total'    => $total,
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

        // optional bucket: within_1 | one_to_five | five_to_ten | over_ten
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

        // *** ในเวลาทำการ ***
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
            ac.id                                 AS conversation_id,
            r.id                                  AS rate_id,
            ac."custId",
            COALESCE(NULLIF(c."custName", \'\'), ac."custId") AS customer_name,
            ac."roomId",
            cr."roomName",
            ac."empCode",
            u.name                                AS employee_name,
            ac."from_empCode",
            tm."tagName"                          AS tag_name,
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
            END                                   AS duration_bucket
        ')
            ->orderBy('ac.endTime', 'desc')
            ->offset($offset)
            ->limit($perPage)
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
}