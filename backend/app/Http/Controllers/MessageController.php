<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Chats\Line\LineReceiveController;
use App\Http\Requests\endTalkRequest;
use App\Http\Requests\sendMessageRequest;
use App\Http\Requests\sendToRequest;
use App\Services\webhooks\LazadaMessageService;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\ChatRooms;
use App\Models\Customers;
use App\Models\Rates;
use App\Models\TagMenu;
use App\Models\User;
use App\Services\MessageService;
use App\Services\PusherService;
use Carbon\Carbon;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    protected MessageService $messageService;
    protected PusherService $pusherService;
    protected LineReceiveController $lineReceiveController;

    public function __construct(MessageService $messageService, PusherService $pusherService, LineReceiveController $lineReceiveController)
    {
        $this->messageService = $messageService;
        $this->pusherService = $pusherService;
        $this->lineReceiveController = $lineReceiveController;
    }

    // ฟังก์ชั่นการส่งข้อความ
    public function send(sendMessageRequest $request): JsonResponse
    {
        $detail = 'ไม่พบข้อผิดพลาด';
        $custId = $request['custId'];
        $conversationId = $request['conversationId'];
        $messages = $request['messages'];
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
            foreach ($messages as $key => $m) {
                $storeChatHistory = new ChatHistory();
                $storeChatHistory['custId'] = $custId;
                $storeChatHistory['contentType'] = $m['contentType'];
                if (($storeChatHistory['contentType'] === 'image') || ($storeChatHistory['contentType'] === 'video') || ($storeChatHistory['contentType'] === 'file')) {
                    if (true) {
                        Log::info('ส่งไฟล์มา-------------------------------------------------------');
                        $file = $m['content'];
                        $fileName = rand(0, 9999) . time() . '.' . $file->getClientOriginalExtension();
                        $path = $file->storeAs('public/line-images', $fileName);
                        // สร้าง URL ให้ frontend ใช้งาน

                        $relativePath = Storage::url(str_replace('public/', '', $path)); // /storage/line-images/xxx.jpg
                        $fullUrl = env('APP_URL') . $relativePath;// http://domain-name/storage/line-images/xxx.jpg
                        // $fullUrl = asset(Storage::url(str_replace('public/', '', $path)));
                        Log::info('URL เต็ม = ' . $fullUrl);
                        Log::info('APP_URL จาก config(app.url) = ' . config('app.url'));
                        $m['content'] = $fullUrl;
                        $storeChatHistory['content'] = $m['content'];
                    } else {
                        throw new \Exception('ไม่สามารถส่งไฟล์ได้');
                    }
                } else $storeChatHistory['content'] = $m['content'];
                $storeChatHistory['sender'] = json_encode(auth()->user());
                $storeChatHistory['conversationRef'] = $conversationId;
                if ($storeChatHistory->save()) {
                    // $this->pusherService->sendNotification($custId);
                    $sendMsgByLine = $this->messageService->sendMsgByLine($custId, $m);
                    if ($sendMsgByLine['status']) {
                        $message = 'ส่งข้อความสำเร็จ';
                        $storeChatHistory['line_message_id'] = $sendMsgByLine['responseJson']['id'];
                        $storeChatHistory['line_quote_token'] = $sendMsgByLine['responseJson']['quoteToken'];
                        Log::info('----------------------------------------');
                        Log::info($sendMsgByLine['responseJson']['id']);
                        Log::info($sendMsgByLine['responseJson']['quoteToken']);
                        Log::info('----------------------------------------');
                        $storeChatHistory->save();
                        $this->pusherService->sendNotification($custId);
                    } else throw new \Exception($sendMsgByLine['message']);
                } else throw new \Exception('สร้าง ChatHistory ไม่สำเร็จ');
                $messages[$key]['content'] = $m['content'];
            }

            Log::info('Foreach Messages ==> ');
            Log::info($messages);
            DB::commit();
            $status = 200;
        } catch (\Exception $e) {
            DB::rollBack();
            $detail = $e->getMessage();
            $status = 400;
            $message = 'เกิดข้อผิดพลาด';
        }

        return response()->json([
            'message' => $message ?? 'เกิดข้อผิดพลาด',
            'detail' => $detail,
            'content' => $messages ?? [],
        ], $status);
    }

    public function reply(Request $request): JsonResponse
    {
        try {
            $message = 'ส่งข้อความไม่สำเร็จ';
            DB::beginTransaction();
            $replyContent = $request['replyContent'];
            $replyContent['contentType'] = $replyContent['type'];
            $replyContent['content'] = $replyContent['text'];
            $replyContent['line_quote_token'] = $request['line_quote_token'];
            $storeChatHistory = new ChatHistory();
            $storeChatHistory['custId'] = $request['custId'];
            $storeChatHistory['contentType'] = $replyContent['type'];
            $storeChatHistory['content'] = $replyContent['text'];
            $storeChatHistory['sender'] = json_encode(auth()->user());
            $storeChatHistory['conversationRef'] = $request['activeId'];
            $storeChatHistory['line_quoted_message_id'] = $request['line_message_id'];
            //            throw new \Exception('joker');
            if ($storeChatHistory->save()) {
                $sendMsgByLine = $this->messageService->sendMsgByLine($request['custId'], $replyContent);
                if ($sendMsgByLine['status']) {
                    $message = 'ส่งข้อความสำเร็จ';
                    $storeChatHistory['line_message_id'] = $sendMsgByLine['responseJson']['id'];
                    $storeChatHistory['line_quote_token'] = $sendMsgByLine['responseJson']['quoteToken'];
                    Log::info('----------------------------------------');
                    Log::info($sendMsgByLine['responseJson']['id']);
                    Log::info($sendMsgByLine['responseJson']['quoteToken']);
                    Log::info('----------------------------------------');
                    $storeChatHistory->save();
                    $this->pusherService->sendNotification($request['custId']);
                } else {
                    throw new \Exception('ไม่สามารถส่ง ข้อความไปยังไลน์ลูกค้าได้');
                }
            } else throw new \Exception('บันทึกลงฐานข้อมูลไม่สำเร็จ');
            DB::commit();
            return response()->json([
                'message' => $message,
                'response' => $storeChatHistory,
                'request' => $request->all(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => $e->getMessage(),
                'response' => [],
                'request' => $request->all(),
            ], $status ?? 400);
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
            $updateAC = ActiveConversations::query()->where('rateRef', $rateId)->orderBy('id', 'desc')->first();
            if (!$updateAC) throw new \Exception('ไม่พบ AC จาก rateRef ที่ receiveAt = null');
            $updateAC['receiveAt'] = Carbon::now();
            $updateAC['startTime'] = Carbon::now();
            $updateAC['empCode'] = auth()->user()->empCode;
            if ($updateAC->save()) {
                $updateRate = Rates::query()->where('id', $rateId)->first();
                if (!$updateRate) throw new \Exception('ไม่พบ Rate ที่ต้องการรับเรื่อง');
                $updateRate['status'] = 'progress';
                if ($updateRate->save()) {
                    // รับเรื่องสำเร็จ
                    $message = 'รับเรื่องสำเร็จ';
                    $status = 200;

                    //ส่งข้อความรับเรื
                    $Rate = Rates::query()->where('id', $rateId)->first();
                    if ($Rate && isset($Rate->menuselect)) {
                    } else {
                    }
                    $this->pusherService->sendNotification($updateAC['custId'], 'มีการรับเรื่อง');
                } else throw new \Exception('ไม่สามารถรับเรื่องได้เนื่องจากมีปัญหาการอัพเดท Rates');
            } else;
            throw new \Exception('แฮร่');

            DB::commit();
        } catch (\Exception $e) {
            $detail = $e->getMessage();
            $status = 400;
            DB::rollBack();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail' => $detail,
            ], $status ?? 400);
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
                $room = ChatRooms::query()->where('roomId', $updateAC['roomId'])->first();
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
                    $chatHistory['content'] = 'มีการส่งต่อมาจาก' . $room['roomName'] . ' โดย 👤' . auth()->user()->name;
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
            $this->pusherService->sendNotification($updateRate['custId']);
            //            $notification = $this->pusherService->newMessage(null, false, 'มีการส่งต่อ');
            //            if (!$notification['status']) {
            //                $status = 400;
            //                throw new \Exception('การแจ้งเตือนผิดพลาด');
            //            }
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
        $Assessment = $request['Assessment'];
        // convert Assessment to boolean
        if ($Assessment === 'true') {
            $Assessment = true;
        } else {
            $Assessment = false;
        }
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
                    if ($Assessment) {
                        /* ส่งการ์ดประเมิน */
                        $send = $this->messageService->MsgEndTalk($updateAC['custId'], $rateId);
                        if (!$send['status']) {
                            throw new \Exception($send['message']);
                        } else {
                            $bot = User::query()->where('empCode', 'BOT')->first();
                            $chatHistory = new ChatHistory();
                            $chatHistory['custId'] = $updateAC['custId'];
                            $chatHistory['content'] = '🤖ระบบได้ส่งแบบประเมินให้ลูกค้าแล้ว🤖';
                            $chatHistory['contentType'] = 'text';
                            $chatHistory['sender'] = json_encode($bot);
                            $chatHistory['conversationRef'] = $updateAC['id'];
                            $chatHistory->save();
                        }
                    }
                    $message = 'คุณได้จบการสนทนาแล้ว';
                    $status = 200;
                } else $detail = 'ไม่่สามารถอัพเดทข้อมูล ActiveConversations';
            } else $detail = 'ไม่สามารถบันทึกข้อมูล Rate';

            $this->pusherService->sendNotification($updateRate['custId']);
            //            $notification = $this->pusherService->newMessage(null, false, 'มีการจบสนทนา');
            //            if (!$notification['status']) {
            //                $status = 400;
            //                throw new \Exception('การแจ้งเตือนผิดพลาด');
            //            }
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

    public function pauseTalk(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $request->validate([
                'activeConversationId' => 'required',
                'rateId' => 'required',
            ], [
                'activeConversationId.required' => 'จำเป็นต้องระบุ ไอดีเคส',
                'rateId.required' => 'จำเป็นต้องระบุ ไอดีเรท'
            ]);
            $rate = Rates::query()->where('id', $request['rateId'])->first();
            $rate->status = 'pending';
            $activeConversation = ActiveConversations::query()->where('id', $request['activeConversationId'])->first();
            $activeConversation->endTime = Carbon::now();
            $activeConversation->totalTime = $this->messageService->differentTime($activeConversation->startTime, $activeConversation->endTime);
            $activeConversation->save();
            $rate->save();
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
                'detail' => $request['activeConversationId'] . $request['rateId']
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('พักการสนทนา เกิดข้อผิดพลาด : ' . $e->getMessage() . '=>' . $e->getLine() . '=>' . $e->getFile());
            return response()->json([
                'message' => $e->getMessage(),
                'body' => $request->all(),
            ], 400);
        }
    }

    public function endTalkAllProgress(Request $request, $roomId): JsonResponse
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

    public function endTalkAllPending(Request $request, $roomId): JsonResponse
    {
        $status = 400;
        $message = 'เกิดข้อผิดพลาด';
        $detail = 'ไม่พบข้อผิดพลาด';
        $user = auth()->user();
        $data = [];
        try {
            $list = $request['list'] ?? [];
            DB::beginTransaction();
            $tag = TagMenu::query()->where('tagName', 'ปิดการสนทนา')->first();
            if (!$tag) throw new \Exception('ไม่พบ Tag ที่ต้องการ');
            if ((count($list) > 0) && $request['list']) {
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
                        } else throw new \Exception('ไม่สามารถอัพเดท Rates');
                    } else throw new \Exception('ไม่สามารถอัพเดท ActiveConversations');
                }
            } else throw new \Exception('ไม่พบรายการที่ต้องการปิดการสนทนา');
            DB::commit();
        } catch (\Exception $e) {
            DB::rollback();
            $status = 400;
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message,
                'detail' => $detail,
                'data' => $data
            ], $status);
        }
    }

    public function uploadFile(Request $request)
    {
        try {
            return response()->json([
                'message' => 'upload file api connected',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'upload file api error',
                'body' => $request->all(),
            ], 400);
        }
    }

}
