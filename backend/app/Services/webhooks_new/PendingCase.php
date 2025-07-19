<?php

namespace App\Services\webhooks_new;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Services\PusherService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PendingCase
{
    protected PusherService $pusherService;
    public function __construct(PusherService $pusherService)
    {
        $this->pusherService = $pusherService;
    }
    public function case($message, $current_rate, $customer, $platformAccessToken, $BOT)
    {
        try {
            $ac_latest = ActiveConversations::query()->where('custId', $current_rate['custId'])
                ->where('rateRef', $current_rate['id'])
                ->orderBy('id', 'desc')
                ->first();
            $store_chat_cust = ChatHistory::query()->create([
                'custId' => $current_rate['custId'],
                'content' => $message['content'],
                'contentType' => $message['contentType'],
                'sender' => json_encode($customer),
                'conversationRef' => $ac_latest['id'],
                'line_message_id' => $message['line_message_id'] ?? null,
                'line_quote_token' => $message['line_quote_token'] ?? null,
                'line_quoted_message_id' => $message['line_quoted_message_id'] ?? null
            ]);
            $this->pusherService->sendNotification($current_rate['custId']);
            if ($current_rate['latestRoomId'] !== 'ROOM00') {
                Log::channel('webhook_main')->info('ปัจจุบันเป็นเคสรอดำเนินการอยู่');

                $ac_all = ActiveConversations::query()->where('roomId', $ac_latest['roomId'])
                    ->whereNull('receiveAt')->orderBy('updated_at', 'asc')->get();
                $count = 1;
                foreach ($ac_all as $ac) {
                    if ($ac['custId'] !== $customer['custId']) $count++;
                    else break;
                }
                DB::beginTransaction();
                $reply_msg = $this->replyMessage($message, $platformAccessToken, $BOT, $count);
                if ($reply_msg['status']) {
                    $store_chat = ChatHistory::query()->create([
                        'custId' => $current_rate['custId'],
                        'content' => $reply_msg['result']['text'],
                        'contentType' => 'text',
                        'sender' => json_encode($BOT),
                        'conversationRef' => $ac_latest['id'],
                        'line_message_id' => $reply_msg['line_message_id'] ?? null,
                        'line_quote_token' => $reply_msg['line_quote_token'] ?? null,
                    ]);
                } else throw new \Exception('ไม่สามารถตอบกลับข้อความได้: ' . $reply_msg['message']);
                if ($store_chat) {
                    $this->pusherService->sendNotification($current_rate['custId']);
                } else {
                    throw new \Exception('ไม่สามารถบันทึกข้อความได้');
                }
                DB::commit();
            } else {
                Log::channel('webhook_main')->info('ปัจจุบันเป็นเคสรอดำเนินการอยู่ ห้องบอท');
            }
        } catch (\Exception $e) {
            DB::rollBack();
            Log::channel('webhook_main')->error('Error in PendingCase: ' . $e->getMessage());
        }
    }


    private function replyMessage($message, $platformAccessToken, $BOT, $count)
    {
        try {

            switch (strtoupper($platformAccessToken['platform'])) {
                case 'LINE': {
                        $msg_body = [
                            'type' => 'text',
                            'text' => 'คิวของท่านคือ ' . $count . ' คิว กรุณารอสักครู่'
                        ];
                        $respose = Http::withHeaders([
                            'Authorization' => 'Bearer ' . $platformAccessToken['accessToken'],
                        ])->post('https://api.line.me/v2/bot/message/reply', [
                            'replyToken' => $message['reply_token'],
                            'messages' => [$msg_body],
                        ]);
                        if ($respose->successful() && $respose->status() === 200) {
                            $response_json = json_decode($respose->body(), true);
                            return [
                                'status' => true,
                                'message' => 'ตอบกลับข้อความสำเร็จ',
                                'result' => [
                                    'text' => $msg_body['text'],
                                    'type' => 'text',
                                    'line_message_id' => $response_json['sentMessages'][0]['id'] ?? null,
                                    'line_quote_token' => $response_json['sentMessages'][0]['quoteToken'] ?? null,
                                ]
                            ];
                        } else {
                            throw new \Exception('ไม่สามารถตอบกลับข้อความได้: ' . $respose->body());
                        }
                    }
                default:
                    throw new \Exception('ไม่รู้จักแพลตฟอร์ม:');
            }
        } catch (\Exception $e) {
            return [
                'status' => false,
                'message' => 'ไม่สามารถตอบกลับข้อความได้: ' . $e->getMessage(),
                'result' => []
            ];
        }
    }
}
