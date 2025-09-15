<?php

namespace App\Http\Controllers\Home\UserCase\Reports;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Home\UserCase\Traits\BusinessHourHelpers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ClosureCompareController extends Controller
{
    use BusinessHourHelpers;
    public function closureStats(Request $request)
    {
        $date       = $request->input('date') ?? Carbon::today()->toDateString();
        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $empCode    = $request->query('empCode');

        $roomId = $request->query('roomId');

        $current      = Carbon::parse($date);
        $previousDay  = $current->copy()->subDay();
        $previousWeek = $current->copy()->subWeek();

        $col = $this->startExpr();

        $fetch = function (Carbon $d) use ($platformId, $dept, $empCode, $col, $roomId) {

            // ในเวลา
            $in = DB::connection("pgsql_real")->table('rates as r')
                ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
                ->where('r.status', 'success')
                ->when($roomId, fn($q) => $q->where('ac.roomId', $roomId))
                ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
                ->whereDate('ac.endTime', $d->toDateString());
            $in = $this->applyUserFilters($in, $dept, $empCode);
            $in = $this->applyPlatformFilter($in, $platformId);
            $in = $this->applyInHours($in, $col)
                ->selectRaw($this->durationSelectRaw())
                ->first();

            // นอกเวลา
            $out = DB::connection("pgsql_real")->table('rates as r')
                ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
                ->where('r.status', 'success')
                ->when($roomId, fn($q) => $q->where('ac.roomId', $roomId))
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
        $roomId = $request->query('roomId');

        $start      = Carbon::parse($request->input('start_date'))->startOfDay();
        $end        = Carbon::parse($request->input('end_date'))->endOfDay();

        $filterCol = 'ac."endTime"';
        $startCol  = $this->startExpr();

        // in-hours
        $inRows = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->where('r.status', 'success')
            ->when($roomId, fn($q) => $q->where('ac.roomId', $roomId))
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->whereBetween(DB::raw($filterCol), [$start, $end]);

        $inRows = $this->applyUserFilters($inRows, $dept, $empCode);
        $inRows = $this->applyPlatformFilter($inRows, $platformId);

        $inRows = $this->applyInHours($inRows, $startCol)
            ->selectRaw("DATE($filterCol) as date, " . $this->durationSelectRaw())
            ->groupBy(DB::raw("DATE($filterCol)"))
            ->orderBy(DB::raw("DATE($filterCol)"))
            ->get()
            ->keyBy('date');

        // out-hours
        $outRows = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->where('r.status', 'success')
            ->when($roomId, fn($q) => $q->where('ac.roomId', $roomId))
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
}
