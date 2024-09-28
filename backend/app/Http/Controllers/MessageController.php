<?php

namespace App\Http\Controllers;

use App\Http\Requests\endTalkRequest;
use App\Http\Requests\sendMessageRequest;
use App\Http\Requests\sendToRequest;
use App\Models\ActiveConversations;
use App\Models\ChatHistory;
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

    // ฟังก์ชั่นการส่งข้อความ
    public function send(sendMessageRequest $request): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่พบข้อผิดพลาด';
        $custId = $request['custId'];
        $conversationId = $request['conversationId'];
        $messages = $request['messages'][0];

        try {
            DB::beginTransaction();
            $storeChatHistory = new ChatHistory();
            $storeChatHistory['custId'] = $custId;
            $storeChatHistory['content'] = $messages['content'];
            $storeChatHistory['contentType'] = $messages['contentType'];
            $storeChatHistory['sender'] = json_encode(auth()->user());
            $storeChatHistory['conversationRef'] = $conversationId;
            if ($storeChatHistory->save()) {
                $sendMsgByLine = $this->messageService->sendMsgByLine($custId,$messages);
                if ($sendMsgByLine['status']) {
                    $message = 'ส่งข้อความสำเร็จ';
                    $status = 200;
                } else throw new \Exception('ส่งข้อความไม่สำเร็จ error => '.$sendMsgByLine['message']);
            } else throw new \Exception('สร้าง ChatHistory ไม่สำเร็จ');
            DB::commit();
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail' => $detail,
            ], $status);
        }
    }

    // ฟังก์ชั่นการรับเรื่อง
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
                if ($updateRate->save()) {
                    $message = 'รับเรื่องสำเร็จ';
                    $status = 200;
                } else $detail = 'ไม่สามารถรับเรื่องได้เนื่องจากมีปัญหาการอัพเดท Rates';
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

    // ฟังก์ชั่นการส่งต่อ
    public function sendTo(sendToRequest $request): JsonResponse
    {
        $status = 400;
        try {
            DB::beginTransaction();
            $updateRate = Rates::where('id', $request['rateId'])->first();
            if (!$updateRate) throw new \Exception('ไม่พบ rate ที่ต้องการอัพเดท');
            $from_roomId = $updateRate['latestRoomId'];
            $updateRate['latestRoomId'] = $request['latestRoomId'];
            $updateRate['status'] = 'pending';
            if ($updateRate->save()) {
                $updateAC = ActiveConversations::where('id', $request['activeConversationId'])->first();
                if (!$updateAC) throw new \Exception('ไม่พบ ActiveConversation ที่ต้องการอัพเดท');
                if (!empty($updateAC['startTime'])) $updateAC['endTime'] = Carbon::now();
                $updateAC['totalTime'] = $this->messageService->differentTime($updateAC['startTime'], $updateAC['endTime']);
                if ($updateAC->save()) {
                    $storeAC = new ActiveConversations();
                    $storeAC['custId'] = $updateRate['custId'];
                    $storeAC['roomId'] = $request['latestRoomId'];
                    $storeAC['from_empCode'] = $updateAC['empCode'];
                    $storeAC['from_roomId'] = $from_roomId;
                    $storeAC['rateRef'] = $updateRate['id'];
                    if ($storeAC->save()) {
                        $message = 'ส่งต่อสำเร็จ';
                        $detail = 'ไม่พบข้อผิดพลาด';
                        $status = 200;
                    } else throw new \Exception('ไม่สามารถส่งต่อได้ (storeAC error)');
                } else throw new \Exception('ไม่สามารถอัพเดท ActiveConversation ได้');
            } else throw new \Exception('ไม่สามารถอัพเดท Rate ได้');
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

    // ฟังชั่นการจบสนทนา
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
