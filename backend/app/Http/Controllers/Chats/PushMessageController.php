<?php

namespace App\Http\Controllers\Chats;

use App\Http\Controllers\Controller;
use App\Http\Requests\sendMessageRequest;
use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Services\PusherService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PushMessageController extends Controller
{

    protected PusherService $pusherService;

    public function __construct(PusherService $pusherService)
    {
        $this->pusherService = $pusherService;
    }
    public function pushMessage(sendMessageRequest $request)
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
                        $extension = '.' . $file->getClientOriginalExtension();
                        $mediaId = rand(0, 9999) . time(); // สร้างชื่อไฟล์แบบสุ่ม
                        $mediaPath = $mediaId . $extension;

                        $mediaContent = file_get_contents($file->getRealPath());

                        $contentType = $file->getClientMimeType();

                        // อัปโหลดไปยัง S3
                        Storage::disk('s3')->put($mediaPath, $mediaContent, [
                            'visibility'  => 'private',
                            'ContentType' => $contentType,
                        ]);
                        $url = Storage::disk('s3')->url($mediaPath);

                        // กำหนด URL ให้ใช้งาน
                        $full_url = $url;

                        // กำหนดค่าใหม่กลับไปให้ content
                        $m['content'] = $full_url;
                        $storeChatHistory['content'] = $full_url;
                    } else {
                        throw new \Exception('ไม่สามารถส่งไฟล์ได้');
                    }
                } else $storeChatHistory['content'] = $m['content'];
                $storeChatHistory['sender'] = json_encode(Auth::user());
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

    private function pushMessageByLine($messages, $platformAccessToken)
    {
        $messages_formatted = [];
        foreach ($messages as $key => $message) {
            if ($message['contentType'] === 'text') {
                $messages_formatted[$key]['type'] = 'text';
                $messages_formatted[$key]['text'] = $message['content'];
            } elseif ($message['contentType'] === 'file') {
                # code...
            } elseif ($message['contentType'] === 'image' || $message['contentType'] === 'sticker') {
                $messages_formatted[$key]['type'] = 'image';
                $messages_formatted[$key]['originalContentUrl'] = $message['content'];
                $messages_formatted[$key]['previewImageUrl'] = $message['content'];
            } elseif ($message['contentType'] === 'video') {
                $messages_formatted[$key]['type'] = 'image';
                $messages_formatted[$key]['originalContentUrl'] = $message['content'];
                $messages_formatted[$key]['previewImageUrl'] = $message['content'];
            } elseif ($message['contentType'] === 'audio') {
                $messages_formatted[$key]['type'] = 'audio';
                $messages_formatted[$key]['originalContentUrl'] = $message['content'];
                $messages_formatted[$key]['duration'] = 6000;
            }
        }
    }
}
