<?php

namespace App\Http\Controllers;

use App\Models\Rates;
use Illuminate\Http\JsonResponse;

class DisplayController extends Controller
{
    public function displayMessageList($roomId){
        $pending = Rates::leftJoin('active_conversations as AC', 'rates.latestRoomId', '=', 'AC.roomId')
            ->leftJoin('customers as C', 'rates.custId', '=', 'C.custId')
            ->where('rates.status', 'LIKE', 'pending')
            ->whereNull('AC.receiveAt')
            ->where('AC.roomId', 'LIKE', $roomId)
            ->select(
                'rates.id',
                'rates.custId',
                'C.custName',
                'AC.id as ac_id',
                'AC.from_roomId',
                'AC.from_empCode'
            )
            ->get();
        $progress = Rates::where('latestRoomId', $roomId)->where('status','progress')->get();
        return response()->json([
            'message' => 'displayMessageList',
            'pending' => $pending,
            'progress' => $progress
        ]);
    }

    public function selectMessage($rateId, $activeId, $custId): JsonResponse
    {
        return response()->json([$rateId, $activeId, $custId]);
    }

}
