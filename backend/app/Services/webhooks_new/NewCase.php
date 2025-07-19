<?php

namespace App\Services\webhooks_new;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Rates;
use App\Services\PusherService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class NewCase
{

    protected CheckKeyword $checkKeyword;
    protected ReplyMessage $replyMessage;
    protected PusherService $pusherService;

    public function __construct(CheckKeyword $checkKeyword, PusherService $pusherService,ReplyMessage $replyMessage)
    {
        $this->replyMessage = $replyMessage;
        $this->checkKeyword = $checkKeyword;
        $this->pusherService = $pusherService;
    }

    public function createCase($message, $customer, $platformAccessToken, $bot)
    {
        try {
            Log::channel('webhook_main')->info('ปัจจุบันเป็นเคสใหม่ ไม่เคยสร้างเคส');
            $now = Carbon::now();
            $keyword = $this->checkKeyword->check($message);
            if ($keyword['status']) { // ถ้าเจอ keyword และเป็นการส่งต่อห้อง
                $new_rate = Rates::query()->create([
                    'custId' => $customer['custId'],
                    'latestRoomId' => $keyword['redirectTo'],
                    'status' => 'pending',
                    'rate' => 0,
                ]);
                $new_ac = ActiveConversations::query()->create([
                    'custId' => $customer['custId'],
                    'roomId' => $keyword['redirectTo'],
                    'rateRef' => $new_rate['id'],
                ]);
            } else {
                $new_rate = Rates::query()->create([
                    'custId' => $customer['custId'],
                    'latestRoomId' => 'ROOM00',
                    'status' => 'progress',
                    'rate' => 0,
                ]);
                $new_ac = ActiveConversations::query()->create([
                    'custId' => $customer['custId'],
                    'roomId' => 'ROOM00',
                    'receiveAt' => $now,
                    'startTime' => $now,
                    'empCode' => $bot['empCode'],
                    'rateRef' => $new_rate['id']
                ]);
            }
            $store_chat = ChatHistory::query()->create([
                'custId' => $customer['custId'],
                'content' => $message['content'],
                'contentType' => $message['contentType'],
                'sender' => json_encode($customer),
                'conversationRef' => $new_ac['id'],
                'line_message_id' => $message['line_quote_token'] ?? null,
                'line_quote_token' => $message['line_quote_token'] ?? null,
                'line_quoted_message_id' => $message['line_quoted_message_id'] ?? null,
            ]);
            $this->pusherService->sendNotification($customer['custId']);

            $msg_bot = [];
            if ($new_rate['latestRoomId'] !== 'ROOM00') {
                $msg_bot[0]['content'] = "สวัสดีคุณ " . $customer['custName'] . " เพื่อให้การบริการของเราดำเนินไปอย่างรวดเร็วและสะดวกยิ่งขึ้น กรุณาเลือกหัวข้อด้านล่าง เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลและบริการท่านได้อย่างถูกต้องและรวดเร็ว ขอบคุณค่ะ/ครับ";
                $msg_bot[0]['contentType'] = 'text';
                $msg_bot[1]['type'] = 'template';
                $msg_bot[1]['altText'] = 'this is a buttons template';
                $msg_bot[1]['template']['type'] = 'buttons';
                $msg_bot[1]['template']['imageBackgroundColor'] = '#FFFFFF';
                $msg_bot[1]['template']['title'] = 'ยินดีต้อนรับ 🤖';
                $msg_bot[1]['template']['text'] = 'กรุณาเลือกเมนูที่ท่านต้องการสอบถาม';
                $msg_bot[1]['template']['actions'][0] = [
                    'type' => 'message',
                    'label' => 'สั่งซื้อสินค้า',
                    'text' => 'สั่งซื้อสินค้า'
                ];
                $msg_bot[1]['template']['actions'][1] = [
                    'type' => 'message',
                    'label' => 'การใช้งานสินค้า',
                    'text' => 'การใช้งานสินค้า'
                ];
                $msg_bot[1]['template']['actions'][2] = [
                    'type' => 'message',
                    'label' => 'บริการหลังการขาย',
                    'text' => 'บริการหลังการขาย'
                ];
                $msg_bot[1]['template']['actions'][3] = [
                    'type' => 'message',
                    'label' => 'ติดต่อเรื่องอื่นๆ',
                    'text' => 'ติดต่อเรื่องอื่นๆ'
                ];

                
            }
            Log::channel('webhook_main')->info('สร้างเคสใหม่สำเร็จ');
        } catch (\Exception $e) {
            Log::channel('webhook_main')->error('เกิดข้อผิดพลาดในการสร้างเคสใหม่: ' . $e->getMessage());
            return ['status' => false, 'message' => 'เกิดข้อผิดพลาดในการสร้างเคสใหม่: ' . $e->getMessage()];
        }
    }
}
