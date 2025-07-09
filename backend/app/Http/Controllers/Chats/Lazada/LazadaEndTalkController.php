<?php

namespace App\Http\Controllers;

use App\Http\Requests\endTalkRequest;
use App\Models\ActiveConversations;
use App\Models\Rates;
use App\Models\User;
use App\Models\ChatHistory;
use App\Services\MessageService;
use App\Services\PusherService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class LazadaEndTalkController extends Controller
{
    protected MessageService $messageService;
    protected PusherService $pusherService;

    public function __construct(MessageService $messageService, PusherService $pusherService)
    {
        $this->messageService = $messageService;
        $this->pusherService = $pusherService;
    }

    public function endTalk(endTalkRequest $request): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่พบข้อผิดพลาด';
        $request->validated();

        $rateId = $request['rateId'];
        $activeId = $request['activeConversationId'];
        $Assessment = filter_var($request['Assessment'], FILTER_VALIDATE_BOOLEAN);

        DB::beginTransaction();
        try {
            $updateRate = Rates::query()->where('id', $rateId)->first();
            if (!$updateRate) throw new \Exception('ไม่พบ Rates ที่ต้องการอัพเดท');
            if ($updateRate['status'] === 'success') throw new \Exception('Rates นี้ได้ปิดการสนทนาไปแล้ว');

            $updateRate['status'] = 'success';
            $updateRate['tag'] = $request['tagId'];
            $updateRate->save();

            $updateAC = ActiveConversations::query()->where('id', $activeId)->first();
            if (!$updateAC) throw new \Exception('ไม่พบ ActiveConversation ที่ต้องการอัพเดท');

            $updateAC['endTime'] = Carbon::now();
            $updateAC['totalTime'] = $this->messageService->differentTime($updateAC['startTime'], $updateAC['endTime']);
            $updateAC->save();

            if ($Assessment) {
                // ส่งการ์ดประเมิน
                $send = $this->messageService->MsgEndTalk($updateAC['custId'], $rateId);
                if (!$send['status']) {
                    throw new \Exception($send['message']);
                }

                $bot = User::query()->where('empCode', 'BOT')->first();
                $chatHistory = new ChatHistory();
                $chatHistory['custId'] = $updateAC['custId'];
                $chatHistory['content'] = '🤖ระบบได้ส่งแบบประเมินให้ลูกค้าแล้ว🤖';
                $chatHistory['contentType'] = 'text';
                $chatHistory['sender'] = json_encode($bot);
                $chatHistory['conversationRef'] = $updateAC['id'];
                $chatHistory->save();
            }

            $message = 'คุณได้จบการสนทนาแล้ว';
            $status = 200;

            $this->pusherService->sendNotification($updateRate['custId']);
            DB::commit();
        } catch (\Exception $e) {
            $detail = $e->getMessage();
            DB::rollBack();
        }

        return response()->json([
            'message' => $message ?? 'เกิดข้อผิดพลาด',
            'detail' => $detail,
        ], $status);
    }
}
