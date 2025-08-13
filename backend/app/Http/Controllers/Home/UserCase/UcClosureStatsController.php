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

    /**
     * วันเชิงธุรกิจ (หน้าต่างข้ามวัน):
     * ถ้าเวลาเริ่ม > 17:00 ให้นับเป็นวันถัดไป
     */
    private function businessDateExpr(string $col): string
    {
        return "
            CASE
                WHEN $col::time > '17:00:00' THEN ($col + INTERVAL '1 day')::date
                ELSE $col::date
            END
        ";
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

        $col   = $this->startExpr();
        $bdate = $this->businessDateExpr($col);

        $q = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->whereBetween(DB::raw($col), [$start, $end]);
        $q = $this->applyUserFilters($q, $dept, $empCode);
        $q = $this->applyPlatformFilter($q, $platformId);
        $q = $this->applyOutHours($q, $col)
            ->selectRaw("$bdate AS date, " . $this->durationSelectRaw())
            ->groupBy(DB::raw('date'))
            ->orderBy(DB::raw('date'));

        $rows = $q->get();

        return response()->json([
            'message' => 'สถิติการปิดเคสนอกเวลาทำการ',
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
}
