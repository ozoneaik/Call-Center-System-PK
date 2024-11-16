<?php

namespace App\Http\Controllers;

use App\Http\Requests\endTalkRequest;
use App\Http\Requests\sendMessageRequest;
use App\Http\Requests\sendToRequest;
use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\Rates;
use App\Models\TagMenu;
use App\Models\User;
use App\Services\MessageService;
use App\Services\PusherService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;


class MessageController extends Controller
{
    protected MessageService $messageService;
    protected PusherService $pusherService;

    public function __construct(MessageService $messageService, PusherService $pusherService)
    {
        $this->messageService = $messageService;
        $this->pusherService = $pusherService;
    }

    // ฟังก์ชั่นการส่งข้อความ
    public function send(sendMessageRequest $request): JsonResponse
    {
        $detail = 'ไม่พบข้อผิดพลาด';
        $custId = $request['custId'];
        $conversationId = $request['conversationId'];
        $messages = $request['messages'];
        foreach ($messages as $m) {
            Log::info($m);
        }
        try {
            $checkCustId = Customers::query()->where('custId', $custId)->first();
            if (!$checkCustId) throw new \Exception('ไม่พบลูกค้าที่ต้องการส่งข้อความไปหา');
            DB::beginTransaction();
            $checkConversation = ActiveConversations::query()->where('id', $conversationId)->first();
            if ($checkConversation) {
                if (!empty($checkConversation['receiveAt'])) {
                    if (empty($checkConversation['startTime'])) {
                        $checkConversation['startTime'] = Carbon::now();
                        $notification = $this->pusherService->newMessage(null, false, 'เริ่มสนทนาแล้ว');
                        if (!$notification['status']) throw new \Exception('การแจ้งเตือนผิดพลาด');
                    }
                    if ($checkConversation->save()) $status = 200;
                    else throw new \Exception('เจอปัญหา startTime ไม่ได้');
                }
            } else throw new \Exception('ไม่พบ active Id');
            foreach ($messages as $m) {
                $storeChatHistory = new ChatHistory();
                $storeChatHistory['custId'] = $custId;
                $storeChatHistory['contentType'] = $m['contentType'];
                if (($storeChatHistory['contentType'] === 'image') || ($storeChatHistory['contentType'] === 'video')) {
                    Log::info('image message');
                    Log::info($m);
                    $URL = env('APP_WEBHOOK_URL') . '/api/file-upload';
                    // ส่งไฟล์แบบ multipart โดยใช้ attach()
                    $response = Http::timeout(30)->attach('file', $m['content']
                        ->get(), $m['content']->getClientOriginalName())->post($URL);
                    Log::info($m['content']);
                    if ($response->status() == 200) {
                        Log::info('บรรทัดที่ 74 messageController');
                        Log::info($storeChatHistory['contentType']);
                        $responseJson = $response->json();
                        $storeChatHistory['content'] = $responseJson['imagePath'];
                        $m['content'] = $responseJson['imagePath'];
                    } else {
                        $storeChatHistory['content'] = 'ส่งรูปภาพ';
                        Log::info($URL);
                        Log::error('Error uploading file: ' . $response->status());
                    }
                } else $storeChatHistory['content'] = $m['content'];
                $storeChatHistory['sender'] = json_encode(auth()->user());
                $storeChatHistory['conversationRef'] = $conversationId;
                if ($storeChatHistory->save()) {
                    // ส่ง pusher
                    $notification = $this->pusherService->newMessage($storeChatHistory, false, 'มีข้อความใหม่เข้ามา');
                    if (!$notification['status']) {
                        throw new \Exception('การแจ้งเตือนผิดพลาด');
                    }
                    $sendMsgByLine = $this->messageService->sendMsgByLine($custId, $m);
                    if ($sendMsgByLine['status']) {
                        $message = 'ส่งข้อความสำเร็จ';
                    } else throw new \Exception($sendMsgByLine['message']);
                } else throw new \Exception('สร้าง ChatHistory ไม่สำเร็จ');
            }
            DB::commit();
            $status = 200;
        } catch (\Exception $e) {
            DB::rollBack();
            $detail = $e->getMessage();
            $status = 400;
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
        $roomId = $request['roomId'];
        try {
            DB::beginTransaction();
            if (!$rateId) throw new \Exception('ไม่พบ AcId');
            $updateAC = ActiveConversations::query()->where('rateRef', $rateId)
                ->where('roomId', $roomId)->where('receiveAt', null)->first();
            if (!$updateAC) throw new \Exception('ไม่พบ AC จาก rateRef ที่ receiveAt = null');
            $updateAC['receiveAt'] = Carbon::now();
            $updateAC['startTime'] = Carbon::now();
            $updateAC['empCode'] = auth()->user()->empCode;
            if ($updateAC->save()) {
                $updateRate = Rates::query()->where('id', $rateId)->first();
                if (!$updateRate) throw new \Exception('ไม่พบ Rate ที่ต้องการรับเรื่อง');
                $updateRate['status'] = 'progress';
                if ($updateRate->save()) {
                    $message = 'รับเรื่องสำเร็จ';
                    $status = 200;
                } else $detail = 'ไม่สามารถรับเรื่องได้เนื่องจากมีปัญหาการอัพเดท Rates';
            } else $detail = 'ไม่สามารถรับเรื่องได้เนื่องจากมีปัญหาการอัพเดท AC';
            $notification = $this->pusherService->newMessage(null, false, 'มีการรับเรื่อง');
            if (!$notification['status']) {
                $status = 400;
                throw new \Exception('การแจ้งเตือนผิดพลาด');
            }
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
            $updateRate = Rates::query()->where('id', $request['rateId'])->first();
            if (!$updateRate) throw new \Exception('ไม่พบ rate ที่ต้องการอัพเดท');
            $from_roomId = $updateRate['latestRoomId'];
            $updateRate['latestRoomId'] = $request['latestRoomId'];
            $updateRate['status'] = 'pending';
            if ($updateRate->save()) {
                $updateAC = ActiveConversations::query()->where('id', $request['activeConversationId'])->first();
                if (!$updateAC) throw new \Exception('ไม่พบ ActiveConversation ที่ต้องการอัพเดท');
                if (!empty($updateAC['startTime'])) {
                    $updateAC['endTime'] = Carbon::now();
                    $updateAC['totalTime'] = $this->messageService->differentTime($updateAC['startTime'], $updateAC['endTime']);
                } else {
                    $updateAC['startTime'] = Carbon::now();
                    $updateAC['endTime'] = $updateAC['startTime'];
                    $updateAC['totalTime'] = '0 วัน 0 ชั่วโมง 0 นาที';
                }
                if ($updateAC->save()) {
                    $storeAC = new ActiveConversations();
                    $storeAC['custId'] = $updateRate['custId'];
                    $storeAC['roomId'] = $request['latestRoomId'];
                    $storeAC['from_empCode'] = $updateAC['empCode'];
                    $storeAC['from_roomId'] = $from_roomId;
                    $storeAC['rateRef'] = $updateRate['id'];
                    $bot = User::query()->where('empCode', 'BOT')->first();
                    $chatHistory = new ChatHistory();
                    $chatHistory['custId'] = $storeAC['custId'];
                    $chatHistory['content'] = 'มีการส่งต่อมาจากห้อง' . $updateAC['roomId'];
                    $chatHistory['contentType'] = 'text';
                    $chatHistory['sender'] = json_encode($bot);
                    $chatHistory['conversationRef'] = $updateAC['id'];
                    $chatHistory->save();
                    if ($storeAC->save()) {
                        $message = 'ส่งต่อสำเร็จ';
                        $detail = 'ไม่พบข้อผิดพลาด';
                        $status = 200;
                    } else throw new \Exception('ไม่สามารถส่งต่อได้ (storeAC error)');
                } else throw new \Exception('ไม่สามารถอัพเดท ActiveConversation ได้');
            } else throw new \Exception('ไม่สามารถอัพเดท Rate ได้');
            $notification = $this->pusherService->newMessage(null, false, 'มีการส่งต่อ');
            if (!$notification['status']) {
                $status = 400;
                throw new \Exception('การแจ้งเตือนผิดพลาด');
            }
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
            $updateRate = Rates::query()->where('id', $rateId)->first();
            if (!$updateRate) throw new \Exception('ไม่พบ Rates ที่ต้องการอัพเดท');
            if ($updateRate['status'] === 'success') throw new \Exception('Rates ที่ต้องการอัพเดท เคยอัพเดทแล้ว');
            $updateRate['status'] = 'success';
            $updateRate['tag'] = $request['tagId'];
            if ($updateRate->save()) {
                $updateAC = ActiveConversations::query()->where('id', $activeId)->first();
                if (!$updateAC) throw new \Exception('ไม่พบ ActiveConversation ที่ต้องการอัพเดท');
                $updateAC['endTime'] = Carbon::now();
                $updateAC['totalTime'] = $this->messageService->differentTime($updateAC['startTime'], $updateAC['endTime']);
                if ($updateAC->save()) {
                    /* ส่งการ์ดประเมิน */
                    $send = $this->messageService->MsgEndTalk($updateAC['custId'], $rateId);
                    if (!$send['status']) {
                        throw new \Exception($send['message']);
                    } else {
                        $bot = User::query()->where('empCode', 'BOT')->first();
                        $chatHistory = new ChatHistory();
                        $chatHistory['custId'] = $updateAC['custId'];
                        $chatHistory['content'] = 'ระบบได้ส่งแบบประเมินให้ลูกค้าแล้ว';
                        $chatHistory['contentType'] = 'text';
                        $chatHistory['sender'] = json_encode($bot);
                        $chatHistory['conversationRef'] = $updateAC['id'];
                        $chatHistory->save();
                    }
                    $message = 'คุณได้จบการสนทนาแล้ว';
                    $status = 200;
                } else $detail = 'ไม่่สามารถอัพเดทข้อมูล ActiveConversations';
            } else $detail = 'ไม่สามารถบันทึกข้อมูล Rate';

            $notification = $this->pusherService->newMessage(null, false, 'มีการจบสนทนา');
            if (!$notification['status']) {
                $status = 400;
                throw new \Exception('การแจ้งเตือนผิดพลาด');
            }
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

    public function endTalkAllProgress(Request $request, $roomId)
    {
        $list = $request['list'];
        $status = 400;
        $message = 'เกิดข้อผิดพลาด';
        $detail = 'ไม่พบข้อผิดพลาด';
        $data = [];
        try {
            DB::beginTransaction();
            if (count($list) > 0) {
                $tag = TagMenu::query()->where('tagName', 'ปิดการสนทนา')->first();
                if (!$tag) throw new \Exception('ไม่พบ Tag ที่ต้องการ');
                foreach ($list as $key => $l) {
                    // update endTime,totalTime as activeConversations
                    $AC = ActiveConversations::query()->where('id', $l['id'])->first();
                    $AC['endTime'] = Carbon::now();
                    $AC['totalTime'] = $this->messageService->differentTime($AC['startTime'], $AC['endTime']);
                    if ($AC->save()) {
                        // update status, tag as rates
                        $R = Rates::query()->where('id', $l['rateRef'])->first();
                        $R['status'] = 'success';
                        $R['tag'] = $tag['id'];
                        if ($R->save()) {
                            $status = 200;
                            $message = 'สำเร็จ';
                            $detail = 'ปืดการสนทนาที่กำลังดำเนินการทั้งหมดสำเร็จ';
                            $data[$key]['AC'] = $AC;
                            $data[$key]['R'] = $R;
                        } else throw new \Exception('ไม่สามารถอัพเดท Rates');
                    } else throw new \Exception('ไม่สามารถอัพเดท ActiveConversations');
                }
            } else throw new \Exception('ไม่พบรายการที่ต้องการปิดการสนทนา');
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            $status = 400;
            $message = 'เกิดข้อผิดพลาด';
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message,
                'detail' => $detail,
                'data' => $data
            ], $status);
        }
    }

    public function endTalkAllPending(Request $request, $roomId){
        $status = 400;
        $message = 'เกิดข้อผิดพลาด';
        $detail = 'ไม่พบข้อผิดพลาด';
        $user = auth()->user();
        $data = [];
        try{
            $list = $request['list'] ?? [];
            DB::beginTransaction();
            $tag = TagMenu::query()->where('tagName', 'ปิดการสนทนา')->first();
            if(!$tag) throw new \Exception('ไม่พบ Tag ที่ต้องการ');
            if((count($list) > 0) && $request['list']){  
                foreach ($list as $key => $l) {
                    // update receiveAt , startTime, endTime, totalTime, empCode as activeConversations
                    $AC = ActiveConversations::query()->where('id', $l['id'])->first();
                    $AC['receiveAt'] = Carbon::now();
                    $AC['startTime'] = Carbon::now();
                    $AC['endTime'] = Carbon::now();
                    $AC['totalTime'] = $this->messageService->differentTime($AC['startTime'], $AC['endTime']);
                    $AC['empCode'] = $user['empCode'];
                    if ($AC->save()) {
                        // update status , tag as rates
                        $R = Rates::query()->where('id', $l['rateRef'])->first();
                        $R['status'] = 'success';
                        $R['tag'] = $tag['id'];
                        if ($R->save()) {
                            $status = 200;
                            $message = 'สำเร็จ';
                            $detail = 'ปืดการสนทนาที่กำลังดำเนินการทั้งหมดสำเร็จ';
                            $data[$key]['AC'] = $AC;
                            $data[$key]['R'] = $R;
                        }else throw new \Exception('ไม่สามารถอัพเดท Rates');
                    }else throw new \Exception('ไม่สามารถอัพเดท ActiveConversations');
                }
            }else throw new \Exception('ไม่พบรายการที่ต้องการปิดการสนทนา');
            DB::commit();
        }catch(\Exception $e) {
            DB::rollback();
            $status = 400;
            $detail = $e->getMessage();
        }finally{
            return response()->json([
                'message' => $message,
                'detail' => $detail,
                'data' => $data
            ], $status);
        }
    }
}
