<?php

namespace App\Http\Controllers\Home\UserCase;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UcClosureStatsController extends Controller
{
    //
    private function durationSelectRaw(): string
    {
        return '
        COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") / 60 < 1) AS within_1_min,
        COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") / 60 >= 1 AND EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") / 60 < 5) AS over_1_min,
        COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") / 60 >= 5 AND EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") / 60 < 10) AS over_5_min,
        COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") / 60 >= 10 AND EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") / 60 < 60) AS over_10_min,
        COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") / 60 >= 60 AND EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") / 60 < 1440) AS over_1_hour,
        COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") / 60 >= 1440) AS over_1_day,
        COUNT(*) AS total
        ';
    }

    private function bucketLabels(): array
    {
        return [
            'within_1_min' => '⏱ ภายใน 1 นาที',
            'over_1_min'   => '⚡ 1-5 นาที',
            'over_5_min'   => '🕒 5-10 นาที',
            'over_10_min'  => '🐢 10 นาที - 1 ชั่วโมง',
            'over_1_hour'  => '⏳ 1-24 ชั่วโมง',
            'over_1_day'   => '🗓️ มากกว่า 1 วัน',
        ];
    }

    /**
     * @param object|null $in  ผล selectRaw(durationSelectRaw) ช่วงในเวลาทำการ
     * @param object|null $out ผล selectRaw(durationSelectRaw) ช่วงนอกเวลาทำการ
     * @return array
     */
    private function buildDurationBuckets(?object $in, ?object $out): array
    {
        $labels = $this->bucketLabels();
        $data = [];

        foreach ($labels as $key => $label) {
            $inVal  = (int) ($in->$key  ?? 0);
            $outVal = (int) ($out->$key ?? 0);

            $data[] = [
                'label'      => $label,
                'in_time'    => $inVal,
                'out_time'   => $outVal,
                'total_case' => $inVal + $outVal,
            ];
        }

        return $data;
    }

    public function caseClosureTimeSummary()
    {
        $today = Carbon::today();

        // In business hours (08:00–17:00)
        $in = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->whereDate('ac.endTime', $today)
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->whereTime('ac.endTime', '>=', '08:00:00')
            ->whereTime('ac.endTime', '<=', '17:00:00')
            ->selectRaw($this->durationSelectRaw())
            ->first();

        // Out of business hours (<08:00 or >17:00)
        $out = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->whereDate('ac.endTime', $today)
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->where(function ($q) {
                $q->whereTime('ac.endTime', '<', '08:00:00')
                    ->orWhereTime('ac.endTime', '>', '17:00:00');
            })
            ->selectRaw($this->durationSelectRaw())
            ->first();

        $buckets = $this->buildDurationBuckets($in, $out);

        // ✅ Logging
        Log::info('caseClosureTimeSummary', [
            'date'    => $today->toDateString(),
            'in'      => $in,
            'out'     => $out,
            'buckets' => $buckets,
        ]);

        return response()->json([
            'date'    => $today->toDateString(),
            'buckets' => $buckets,
        ]);
    }

    public function closureStats(Request $request)
    {
        $date = $request->input('date') ?? Carbon::today()->toDateString();
        $current = Carbon::parse($date);
        $previousDay = $current->copy()->subDay();
        $previousWeek = $current->copy()->subWeek();

        $fetch = function (Carbon $d) {
            $in = DB::connection("pgsql_real")->table('rates as r')
                ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
                ->whereDate('ac.endTime', $d)
                ->where('r.status', 'success')
                ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
                ->whereTime('ac.endTime', '>=', '08:00:00')
                ->whereTime('ac.endTime', '<=', '17:00:00')
                ->selectRaw($this->durationSelectRaw())
                ->first();

            $out = DB::connection("pgsql_real")->table('rates as r')
                ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
                ->whereDate('ac.endTime', $d)
                ->where('r.status', 'success')
                ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
                ->where(function ($q) {
                    $q->whereTime('ac.endTime', '<', '08:00:00')
                        ->orWhereTime('ac.endTime', '>', '17:00:00');
                })
                ->selectRaw($this->durationSelectRaw())
                ->first();

            return [
                'date'    => $d->toDateString(),
                'buckets' => $this->buildDurationBuckets($in, $out),
            ];
        };

        $curr = $fetch($current);
        $prevDay = $fetch($previousDay);
        $prevWeek = $fetch($previousWeek);

        // ✅ Logging
        Log::info("closureStats\n" . json_encode([
            'current'       => $curr,
            'previous_day'  => $prevDay,
            'previous_week' => $prevWeek,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

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
        $start = Carbon::parse($request->input('start_date'))->startOfDay();
        $end   = Carbon::parse($request->input('end_date'))->endOfDay();

        // In-hours grouped by date
        $inRows = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->whereBetween('ac.endTime', [$start, $end])
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->whereTime('ac.endTime', '>=', '08:00:00')
            ->whereTime('ac.endTime', '<=', '17:00:00')
            ->selectRaw('DATE(ac."endTime") as date, ' . $this->durationSelectRaw())
            ->groupBy(DB::raw('DATE(ac."endTime")'))
            ->orderBy(DB::raw('DATE(ac."endTime")'))
            ->get()
            ->keyBy('date');

        // Out-hours grouped by date
        $outRows = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->whereBetween('ac.endTime', [$start, $end])
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->where(function ($q) {
                $q->whereTime('ac.endTime', '<', '08:00:00')
                    ->orWhereTime('ac.endTime', '>', '17:00:00');
            })
            ->selectRaw('DATE(ac."endTime") as date, ' . $this->durationSelectRaw())
            ->groupBy(DB::raw('DATE(ac."endTime")'))
            ->orderBy(DB::raw('DATE(ac."endTime")'))
            ->get()
            ->keyBy('date');

        $cursor = $start->copy();
        $payload = [];

        while ($cursor->lte($end)) {
            $d = $cursor->toDateString();
            $in  = $inRows->get($d);
            $out = $outRows->get($d);

            $buckets = $this->buildDurationBuckets($in, $out);
            $payload[] = [
                'date'    => $d,
                'buckets' => $buckets,
            ];

            $cursor->addDay();
        }

        Log::info('closureRangeStats' . json_encode([
            'start'   => $start->toDateTimeString(),
            'end'     => $end->toDateTimeString(),
            'days'    => count($payload),
            'payload' => $payload,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return response()->json([
            'range'  => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'data'   => $payload,
        ]);
    }

    public function afterHourClosureStats()
    {
        $today = Carbon::today();

        $results = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->whereDate('ac.endTime', $today)
            ->where(function ($query) {
                $query->whereTime('ac.endTime', '<', '08:00:00')
                    ->orWhereTime('ac.endTime', '>', '17:00:00');
            })
            ->selectRaw($this->durationSelectRaw())
            ->first();

        return response()->json([
            'message' => 'ปิดเคสนอกเวลาทำการของวันที่ ' . $today->toDateString(),
            'data' => $results
        ]);
    }

    public function afterHourClosureRangeStats(Request $request)
    {
        $start = Carbon::parse($request->input('start_date'))->startOfDay();
        $end = Carbon::parse($request->input('end_date'))->endOfDay();

        $results = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->where('r.status', 'success')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->whereBetween('ac.endTime', [$start, $end])
            ->where(function ($query) {
                $query->whereTime('ac.endTime', '<', '08:00:00')
                    ->orWhereTime('ac.endTime', '>', '17:00:00');
            })
            ->selectRaw(
                '
            DATE(ac."endTime") as date,
            ' . $this->durationSelectRaw()
            )
            ->groupBy(DB::raw('DATE(ac."endTime")'))
            ->orderBy(DB::raw('DATE(ac."endTime")'))
            ->get();

        return response()->json([
            'message' => 'สถิติการปิดเคสนอกเวลาทำการ (ช่วง 00:00-07:59 และ 17:01-23:59)',
            'data' => $results
        ]);
    }
}
