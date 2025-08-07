<?php

namespace App\Services\webhooks_new;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Rates;
use App\Services\PusherService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class SuccessCase
{

    protected PusherService $pusherService;
    protected ReplyMessage $replyMessage;

    public function __construct(PusherService $pusherService, ReplyMessage $replyMessage)
    {
        $this->pusherService = $pusherService;
        $this->replyMessage = $replyMessage;
    }
    public function case($message, $current_rate, $customer, $platformAccessToken, $bot)
    {
        // ถ้า updated_at(2025-08-07 21:23:23.000) ก่อนหน้า น้อยกว่า หรือ เท่ากับ 12 ชั่วโมง (2025-08-07 21:40:23.000)
        if ($current_rate['updated_at'] >= now()->subHours(12)) {
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
        } else {
            $new_rate = Rates::query()->create([
                'custId' => $customer['custId'],
                'rate' => 0,
                'latestRoomId' => 'ROOM00',
                'status' => 'progress',
            ]);
            $new_ac = ActiveConversations::query()->create([
                'custId' => $customer['custId'],
                'roomId' => $new_rate['latestRoomId'],
                'rateRef' => $new_rate['id'],
                'receiveAt' => Carbon::now(),
                'startTime' => Carbon::now(),
                'empCode' => $bot['empCode'],
            ]);
        }
        $new_chat = ChatHistory::query()->create([
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

        if ($current_rate['updated_at'] >= now()->subHours(12)) {
            $msg_bot = [];
            $reply_token = $message['reply_token'];
            switch (strtoupper($platformAccessToken['platform'])) {
                case 'LINE':
                    $msg_bot[0]['text'] = 'ระบบกำลังส่งต่อให้เจ้าหน้าที่ กรุณารอซักครู่';
                    $msg_bot[0]['type'] = 'text';
                    break;
                default:
                    $msg_bot['content'] = 'ระบบกำลังส่งต่อให้เจ้าหน้าที่ กรุณารอซักครู่';
                    $msg_bot['contentType'] = 'text';
                    break;
            }
            $bot_send_msg = $this->replyMessage->reply($msg_bot, $platformAccessToken, $customer, $bot, $reply_token);

            if (!$bot_send_msg['status']) {
                Log::channel('webhook_main')->error($bot_send_msg['message'], [
                    'error' => $bot_send_msg['message']
                ]);
            } else {
                ChatHistory::query()->create([
                    'custId' => $current_rate['custId'],
                    'content' => 'ระบบกำลังส่งต่อให้เข้าหน้าที่ กรุณารอซักครู่',
                    'contentType' => 'text',
                    'sender' => json_encode($bot),
                    'conversationRef' => $new_ac['id'],
                    'line_message_id' => $bot_send_msg['response']['line_message_id'] ?? null,
                    'line_quote_token' => $bot_send_msg['response']['line_quote_token'] ?? null,
                ]);
            }
            $this->pusherService->sendNotification($customer['custId']);
        } else {
            $msg_bot = NewCase::formatBotMenu($customer['custName'], $platformAccessToken['platform'], $platformAccessToken['id']);
            $reply_message = $this->replyMessage->reply($msg_bot, $platformAccessToken, $customer, $bot, $message['reply_token']);
            if ($reply_message['status']) {
                Log::channel('webhook_main')->info('ส่งข้อความตอบกลับสำเร็จ', [
                    'response' => $reply_message['response'],
                ]);
                ChatHistory::query()->create([
                    'custId' => $customer['custId'],
                    'content' => $msg_bot[0]['text'],
                    'contentType' => 'text',
                    'sender' => json_encode($bot),
                    'conversationRef' => $new_ac['id'],
                ]);
                ChatHistory::query()->create([
                    'custId' => $customer['custId'],
                    'content' => 'บอทได้ทำงานส่งเมนูไปยังลูกค้าแล้ว',
                    'contentType' => 'text',
                    'sender' => json_encode($bot),
                    'conversationRef' => $new_ac['id'],
                ]);
                $this->pusherService->sendNotification($customer['custId']);
            } else {
                Log::channel('webhook_main')->error('ไม่สามารถส่งข้อความตอบกลับได้', [
                    'error' => $reply_message['message']
                ]);
            }
        }
    }
}
