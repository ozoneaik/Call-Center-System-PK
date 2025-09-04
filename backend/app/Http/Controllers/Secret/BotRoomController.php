<?php

namespace App\Http\Controllers\Secret;

use App\Http\Controllers\Controller;
use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\ChatRooms;
use App\Models\PlatformAccessTokens;
use App\Models\Rates;
use App\Services\MessageService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BotRoomController extends Controller
{
    protected MessageService $messageService;

    public function __construct(MessageService $messageService)
    {
        $this->messageService = $messageService;
    }

    public function index()
    {
        $botRooms = Rates::query()
            ->leftJoin('customers', 'rates.custId', '=', 'customers.custId')
            ->whereNot('rates.status', 'success')
            ->where('rates.latestRoomId', 'ROOM00')
            ->select('rates.*', 'customers.custName', 'customers.platformRef')
            ->get();

        $botRooms = $botRooms->toArray();

        foreach ($botRooms as $key => $botRoom) {
            $botRooms[$key]['latestMessage'] = ChatHistory::query()
                ->where('custId', $botRoom['custId'])
                ->where('sender->custId', $botRoom['custId']) // ใส่ empCode ที่ต้องการ
                ->orderBy('id', 'desc')
                ->first();
            $botRooms[$key]['platform'] = PlatformAccessTokens::query()->where('id', $botRoom['platformRef'])->first();
        }

        $roomList = ChatRooms::query()->whereNot('roomId', 'ROOM00')->get();
        return response()->json([
            'status' => true,
            'data' => $botRooms,
            'type' => gettype($botRooms),
            'roomList' => $roomList,
        ]);
    }

    public function changeRoomByOne($rateId, $roomId)
    {
        try {
            DB::beginTransaction();
            $rate = Rates::query()->where('id', $rateId)
                ->where('latestRoomId', 'ROOM00')
                ->whereNot('status', 'success')->first();
                if(!$rate) throw new \Exception('ไม่พบข้อมูล Rate');
            $ac = ActiveConversations::query()
                ->where('rateRef', $rateId)
                ->where('roomId', $rate->latestRoomId)
                ->orderBy('id', 'desc')->first();
            if ($rate->status === 'pending') {
                $ac->startTime = Carbon::now();
                $ac->endTime = Carbon::now();
                $ac->totalTime = $this->messageService->differentTime($ac->startTime, $ac->endTime);
            } else {
                $ac->endTime = Carbon::now();
                $ac->totalTime = $this->messageService->differentTime($ac->startTime, $ac->endTime);
            }
            $ac->save();
            $rate->status = 'pending';
            $rate->latestRoomId = $roomId;
            $newAc = ActiveConversations::query()->create([
                'custId' => $rate->custId,
                'rateRef' => $rateId,
                'roomId' => $roomId,
                'from_roomId' => $ac->roomId,
                'from_empCode' => 'BOT',
            ]);
            $rate->save();
            DB::commit();
            return response()->json([
                'status' => true,
                'message' => 'เปลี่ยนห้องสำเร็จ',
                'data' => $newAc,
                'rate' => $rate,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => $e->getMessage(),
            ],400);
        }
    }

    public function changeRoomAll(Request $request) {}
}
