<?php

namespace App\Http\Controllers;

use App\Http\Requests\endTalkRequest;
use App\Models\ActiveConversations;
use App\Models\Rates;
use App\Services\MessageService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


class MessageController extends Controller
{
    protected MessageService $messageService;

    public function __construct(MessageService $messageService)
    {
        $this->messageService = $messageService;
    }


    public function selectMessage($rateId, $activeId, $custId): JsonResponse
    {
        return response()->json([$rateId, $activeId, $custId]);
    }

    public function send(): JsonResponse
    {
        return response()->json('hello');
    }

    public function receive(Request $request): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่พบข้อผิดพลาด';
        $rateId = $request['rateId'];
        try {
            DB::beginTransaction();
            if (!$rateId) throw new \Exception('ไม่พบ activeConversationId');
            $updateAC = ActiveConversations::where('rateRef', $rateId)->where('receiveAt', null)->first();
            if (!$updateAC) throw new \Exception('ไม่พบ activeConversation จาก rateRef ที่ receiveAt = null');
            $updateAC['receiveAt'] = Carbon::now();
            $updateAC['empCode'] = auth()->user()->empCode;
            if ($updateAC->save()) {
                $updateRate = Rates::where('id', $rateId)->first();
                if (!$updateRate) throw new \Exception('ไม่พบ Rate ที่ต้องการรับเรื่อง');
                $updateRate['status'] = 'progress';
                if ($updateRate->save()){
                    $message = 'รับเรื่องสำเร็จ';
                    $status = 200;
                }else $detail = 'ไม่สามารถรับเรื่องได้เนื่องจากมีปัญหาการอัพเดท Rates';
            } else $detail = 'ไม่สามารถรับเรื่องได้เนื่องจากมีปัญหาการอัพเดท activeConversation';
            DB::commit();
        } catch (\Exception $e) {
            $detail = $e->getMessage();
            DB::rollBack();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail' => $detail,
            ], $status);
        }
    }

    public function sendTo(): JsonResponse
    {
        return response()->json('hello');
    }

    public function endTalk(endTalkRequest $request): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่พบข้อผิดพลาด';
        $request->validated();
        $rateId = $request['rateId'];
        $activeId = $request['activeConversationId'];
        DB::beginTransaction();
        try {
            $updateRate = Rates::where('id', $rateId)->first();
            if (!$updateRate) throw new \Exception('ไม่พบ Rates ที่ต้องการอัพเดท');
            if ($updateRate['status'] === 'success') throw new \Exception('Rates ที่ต้องการอัพเดท เคยอัพเดทแล้ว');
            $updateRate['status'] = 'success';
            if ($updateRate->save()) {
                $updateAC = ActiveConversations::where('id', $activeId)->first();
                if (!$updateAC) throw new \Exception('ไม่พบ ActiveConversation ที่ต้องการอัพเดท');
                $updateAC['endTime'] = Carbon::now();
                $updateAC['totalTime'] = $this->messageService->differentTime($updateAC['startTime'], $updateAC['endTime']);
                if ($updateAC->save()) {
                    $message = 'คุณได้จบการสนทนาแล้ว';
                    $status = 200;
                } else $detail = 'ไม่่สามารถอัพเดทข้อมูล ActiveConversations';
            } else $detail = 'ไม่สามารถบันทึกข้อมูล Rate';
            /* ส่งการ์ดประเมิน */
            $this->messageService->sendMsgByLine($updateRate['custId']);
            DB::commit();
        } catch (\Exception $e) {
            $detail = $e->getMessage();
            DB::rollBack();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail' => $detail,
            ], $status);
        }
    }
}
