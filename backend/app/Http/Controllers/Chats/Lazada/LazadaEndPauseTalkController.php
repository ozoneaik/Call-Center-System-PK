<?php

namespace App\Http\Controllers;

use App\Models\ActiveConversations;
use App\Models\Rates;
use App\Services\MessageService;
use App\Services\PusherService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LazadaPauseTalkController extends Controller
{
    protected MessageService $messageService;
    protected PusherService $pusherService;

    public function __construct(MessageService $messageService, PusherService $pusherService)
    {
        $this->messageService = $messageService;
        $this->pusherService = $pusherService;
    }

    public function pauseTalk(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'activeConversationId' => 'required',
                'rateId' => 'required',
            ], [
                'activeConversationId.required' => 'จำเป็นต้องระบุ ไอดีเคส',
                'rateId.required' => 'จำเป็นต้องระบุ ไอดีเรท'
            ]);

            DB::beginTransaction();

            $rate = Rates::query()->where('id', $request['rateId'])->first();
            if (!$rate) throw new \Exception('ไม่พบ Rate');

            $rate->status = 'pending';

            $activeConversation = ActiveConversations::query()->where('id', $request['activeConversationId'])->first();
            if (!$activeConversation) throw new \Exception('ไม่พบ ActiveConversation');

            $activeConversation->endTime = Carbon::now();
            $activeConversation->totalTime = $this->messageService->differentTime($activeConversation->startTime, $activeConversation->endTime);

            $activeConversation->save();
            $rate->save();

            // สร้าง ActiveConversation ใหม่ (พักการสนทนา)
            $newAc = new ActiveConversations();
            $newAc->custId = $rate->custId;
            $newAc->roomId = $activeConversation->roomId;
            $newAc->from_empCode = $activeConversation->empCode;
            $newAc->from_roomId = $activeConversation->roomId;
            $newAc->rateRef = $rate->id;
            $newAc->save();

            DB::commit();

            $this->pusherService->sendNotification($rate['custId']);

            return response()->json([
                'message' => 'พักการสนทนาแล้ว',
                'detail' => 'ActiveConversation ID: ' . $request['activeConversationId'] . ', Rate ID: ' . $request['rateId']
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('พักการสนทนา เกิดข้อผิดพลาด : ' . $e->getMessage());
            return response()->json([
                'message' => $e->getMessage(),
                'body' => $request->all(),
            ], 400);
        }
    }
}
