<?php

namespace App\Http\Controllers;

use App\Models\ActiveConversations;
use App\Models\Rates;
use App\Services\PusherService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CaseController extends Controller
{

    protected PusherService $pusherService;
    public function __construct(PusherService $pusherService)
    {
        $this->pusherService = $pusherService;
    }
    public function store(Request $request)
    {
        try {
            $request->validate([
                'roomId' => 'required',
                'custId' => 'required',
                'roomName' => 'required',
            ],[
                'roomId.required' => 'ไม่พบไอดีห้องแชท',
                'custId.required' => 'ไม่พบไอดีลูกค้า',
                'roomName.required' => 'ไม่พบชื่อห้องแชท',
            ]);
            DB::beginTransaction();
            $roomId = $request->roomId;
            $custId = $request->custId;
            $roomName = $request->roomName;
            $rate = Rates::query()->create([
                'latestRoomId' => $roomId,
                'custId' => $custId,
                'status' => 'progress',
                'rate' => 0,
            ]);
            if ($rate) {
                $ac = ActiveConversations::query()->create([
                    'roomId' => $roomId,
                    'custId' => $custId,
                    'rateRef' => $rate->id,
                    'receiveAt' => Carbon::now(),
                    'startTime' => Carbon::now(),
                    'empCode' => Auth::user()->empCode,
                ]);
                if ($ac) {
                    DB::commit();
                    $this->pusherService->sendNotification($ac->custId, 'มีการรับเรื่อง');
                    return response()->json([
                        'message' => "เคสถูกสร้างที่ห้องแชท $roomName โดยมีคนรับเรื่อง คือ <br/>" . Auth::user()->name,
                        'data' => [$rate,$ac]
                    ]);                                                                 
                } else throw new \Exception('ไม่สามารถสร้างข้อมูลได้ [create ActiveConversations Failed]');
            } else throw new \Exception('ไม่สามารถสร้างข้อมูลได้ [create Rate Failed]');
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => $e->getMessage() ?? "สร้างเคสไม่สำเร็จ",
                'data' => []
            ],400);
        }
    }
}
