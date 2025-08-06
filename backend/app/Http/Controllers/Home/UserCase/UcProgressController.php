<?php

namespace App\Http\Controllers\Home\UserCase;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class UcProgressController extends Controller
{
    //
    public function getProgressDetails($empCode)
    {
        $todayProgress = DB::connection("pgsql_real")->table('rates as r')
            ->join('active_conversations as ac', 'ac.rateRef', '=', 'r.id')
            ->select(
                'ac.id as conversation_id',
                'ac.topic',
                'r.created_at as case_created',
                'r.updated_at as case_updated',
                DB::raw('EXTRACT(HOUR FROM (NOW() - r.created_at)) as hours_elapsed')
            )
            ->where('ac.empCode', $empCode)
            ->whereDate('r.updated_at', Carbon::today())
            ->where('r.status', 'progress')
            ->orderBy('r.created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Progress details retrieved successfully',
            'empCode' => $empCode,
            'todayProgress' => $todayProgress,
            'totalToday' => $todayProgress->count()
        ]);
    }
}
