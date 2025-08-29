<?php

namespace App\Services\webhooks_new;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Rates;
use App\Services\PusherService;
use Carbon\Carbon;

class SuccessCase
{

    protected PusherService $pusherService;
    protected CheckKeyword $checkKeyword;

    public function __construct(PusherService $pusherService, CheckKeyword $checkKeyword)
    {
        $this->pusherService = $pusherService;
        $this->checkKeyword = $checkKeyword;
    }
    public function case($message, $current_rate, $customer, $platformAccessToken, $bot)
    {
        // ถ้าเคสก่อนหน้าผ่านมาภายใน 12 ชั่วโมง
        if ($current_rate['updated_at'] >= now()->subHours(12)) {
            $keyword = $this->checkKeyword->check($message, 'success');
            if ($keyword['status'] && !$keyword['redirectTo_status']) {
                $latest_ac = ActiveConversations::query()->where('custId', $current_rate['custId'])
                    ->where('rateRef', $current_rate['id'])->orderBy('id', 'desc')->first();
                ChatHistory::query()->create([
                    'custId' => $current_rate['custId'],
                    'content' => $message['content'],
                    'contentType' => $message['contentType'],
                    'sender' => json_encode($customer),
                    'conversationRef' => $latest_ac['id'],
                    'line_message_id' => $message['line_message_id'] ?? null,
                    'line_quote_token' => $message['line_quote_token'] ?? null,
                    'line_quoted_message_id' => $message['line_quoted_message_id'] ?? null
                ]);
                return ['status' => true, 'send_to_cust' => false];
            } elseif ($keyword['status'] && $keyword['redirectTo_status']) {
                $new_rate = Rates::query()->create([
                    'custId' => $customer['custId'],
                    'rate' => 0,
                    'latestRoomId' => $keyword['redirectTo'],
                    'status' => 'pending',
                ]);
                $new_ac = ActiveConversations::query()->create([
                    'custId' => $customer['custId'],
                    'roomId' => $new_rate['latestRoomId'],
                    'rateRef' => $new_rate['id'],
                ]);
                ChatHistory::query()->create([
                    'custId' => $current_rate['custId'],
                    'content' => $message['content'],
                    'contentType' => $message['contentType'],
                    'sender' => json_encode($customer),
                    'conversationRef' => $new_ac['id'],
                    'line_message_id' => $message['line_message_id'] ?? null,
                    'line_quote_token' => $message['line_quote_token'] ?? null,
                    'line_quoted_message_id' => $message['line_quoted_message_id'] ?? null
                ]);
                $this->pusherService->sendNotification($customer['custId']);
                return [
                    'status' => true,
                    'send_to_cust' => true,
                    'type_send' => 'sended',
                    'type_message' => 'reply',
                    'messages' => [['content' => 'ระบบกำลังส่งต่อให้เจ้าหน้าที่ กรุณารอซักครู่', 'contentType' => 'text']],
                    'customer' => $customer,
                    'ac_id' => $new_ac['id'],
                    'platform_access_token' => $platformAccessToken,
                    'reply_token' => $message['reply_token'],
                    'bot' => $bot
                ];
            } else {
                $new_rate = Rates::query()->create([
                    'custId' => $customer['custId'],
                    'rate' => 0,
                    'latestRoomId' => $current_rate['latestRoomId'],
                    'status' => 'pending',
                ]);
                $new_ac = ActiveConversations::query()->create([
                    'custId' => $customer['custId'],
                    'roomId' => $new_rate['latestRoomId'],
                    'rateRef' => $new_rate['id'],
                ]);
                ChatHistory::query()->create([
                    'custId' => $current_rate['custId'],
                    'content' => $message['content'],
                    'contentType' => $message['contentType'],
                    'sender' => json_encode($customer),
                    'conversationRef' => $new_ac['id'],
                    'line_message_id' => $message['line_message_id'] ?? null,
                    'line_quote_token' => $message['line_quote_token'] ?? null,
                    'line_quoted_message_id' => $message['line_quoted_message_id'] ?? null
                ]);
                $this->pusherService->sendNotification($customer['custId']);
                return [
                    'status' => true,
                    'send_to_cust' => true,
                    'type_send' => 'sended',
                    'type_message' => 'reply',
                    'messages' => [['content' => 'ระบบกำลังส่งต่อให้เจ้าหน้าที่ กรุณารอซักครู่', 'contentType' => 'text']],
                    'customer' => $customer,
                    'ac_id' => $new_ac['id'],
                    'platform_access_token' => $platformAccessToken,
                    'reply_token' => $message['reply_token'],
                    'bot' => $bot
                ];
            }
        }
        // ถ้าเคสก่อนหน้าผ่านมาเกิน 12 ชั่วโมง
        else {

            $keyword = $this->checkKeyword->check($message);

            if ($keyword['status'] && $keyword['redirectTo_status']) {
                $new_rate = Rates::query()->create([
                    'custId' => $customer['custId'],
                    'latestRoomId' => $keyword['redirectTo'],
                    'status' => 'pending',
                    'rate' => 0,
                ]);
                $new_ac = ActiveConversations::query()->create([
                    'custId' => $customer['custId'],
                    'roomId' => $new_rate['latestRoomId'],
                    'receiveAt' => null,
                    'startTime' => null,
                    'empCode' => $bot['empCode'],
                    'rateRef' => $new_rate['id']
                ]);
                ChatHistory::query()->create([
                    'custId' => $customer['custId'],
                    'content' => $message['content'],
                    'contentType' => $message['contentType'],
                    'sender' => json_encode($customer),
                    'conversationRef' => $new_ac['id'],
                    'line_message_id' => $message['line_message_id'] ?? null,
                    'line_quote_token' => $message['line_quote_token'] ?? null,
                    'line_quoted_message_id' => $message['line_quoted_message_id'] ?? null
                ]);
                $this->pusherService->sendNotification($customer['custId']);
                return [
                    'status' => true,
                    'send_to_cust' => true,
                    'type_send' => 'normal',
                    'type_message' => 'reply',
                    'messages' => [
                        [
                            'content' => 'ระบบกำลังส่งต่อให้เจ้าหน้าที่ กรุณารอซักครู่',
                            'contentType' => 'text'
                        ]
                    ],
                    'customer' => $customer,
                    'ac_id' => $new_ac['id'],
                    'platform_access_token' => $platformAccessToken,
                    'reply_token' => $message['reply_token'],
                    'bot' => $bot
                ];
            } elseif ($keyword['status'] && !$keyword['redirectTo_status']) {
                $latest_ac = ActiveConversations::query()->where('custId', $current_rate['custId'])
                    ->where('rateRef', $current_rate['id'])->orderBy('id', 'desc')->first();
                ChatHistory::query()->create([
                    'custId' => $current_rate['custId'],
                    'content' => $message['content'],
                    'contentType' => $message['contentType'],
                    'sender' => json_encode($customer),
                    'conversationRef' => $latest_ac['id'],
                    'line_message_id' => $message['line_message_id'] ?? null,
                    'line_quote_token' => $message['line_quote_token'] ?? null,
                    'line_quoted_message_id' => $message['line_quoted_message_id'] ?? null
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
                    'roomId' => $new_rate['latestRoomId'],
                    'receiveAt' => Carbon::now(),
                    'startTime' => Carbon::now(),
                    'empCode' => $bot['empCode'],
                    'rateRef' => $new_rate['id']
                ]);
                ChatHistory::query()->create([
                    'custId' => $customer['custId'],
                    'content' => $message['content'],
                    'contentType' => $message['contentType'],
                    'sender' => json_encode($customer),
                    'conversationRef' => $new_ac['id'],
                    'line_message_id' => $message['line_message_id'] ?? null,
                    'line_quote_token' => $message['line_quote_token'] ?? null,
                    'line_quoted_message_id' => $message['line_quoted_message_id'] ?? null
                ]);
                $this->pusherService->sendNotification($customer['custId']);
                $content = "สวัสดีคุณ" . $customer['custName'];
                // $content = $content . "เพื่อให้การบริการของเราดำเนินไปอย่างรวดเร็วและสะดวกยิ่งขึ้น";
                // $content = $content . "กรุณาเลือกหัวข้อด้านล่าง เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลและบริการท่านได้อย่างถูกต้องและรวดเร็ว ขอบคุณค่ะ/ครับ";
                $content = $content . "เนื่องจาก ในวันที่ 30/08/2568 - 01/09/2568 ทางบริษัทมีการจัดสัมนาประจำปี";
                $content = $content . "จึงทำให้การให้ข้อมูลคุณลูกค้าอาจจะล่าช้ากว่าปกติ จึงขออภัยมา ณ ที่นี่ด้วย";
                $content = $content . "เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลท่านได้ถูกต้อง กรุณาเลือก เมนู ที่ท่านต้องการติดต่อ";
                return [
                    'status' => true,
                    'send_to_cust' => true,
                    'type_send' => 'menu',
                    'type_message' => 'reply',
                    'messages' => [
                        [
                            'content' => $content,
                            'contentType' => 'text'
                        ]
                    ],
                    'customer' => $customer,
                    'ac_id' => $new_ac['id'],
                    'platform_access_token' => $platformAccessToken,
                    'reply_token' => $message['reply_token'],
                    'bot' => $bot
                ];
            }
        }
    }
}
