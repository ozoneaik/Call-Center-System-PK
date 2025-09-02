<?php

namespace App\Services\webhooks_new;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Rates;
use App\Services\PusherService;
use Carbon\Carbon;
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
            // $ac_all = ActiveConversations::query()->where('roomId', $ac_latest['roomId'])
            //     ->whereNull('receiveAt')->orderBy('updated_at', 'asc')->get();
            $ac_all = Rates::query()->where('latestRoomId', $ac_latest['roomId'])
                ->where('status', 'pending')->orderBy('updated_at', 'asc')->get();
            $count = 1;
            foreach ($ac_all as $ac) {
                if ($ac['custId'] !== $customer['custId']) $count++;
                else break;
            }
            if ($current_rate['latestRoomId'] !== 'ROOM00') {
                Log::channel('webhook_main')->info('ปัจจุบันเป็นเคสรอดำเนินการอยู่');
            } else {
                Log::channel('webhook_main')->info('ปัจจุบันเป็นเคสรอดำเนินการอยู่ ห้องบอท');
                $default_room = $platformAccessToken['room_default_id'] ?? 'ROOM99';
                $current_rate->update([
                    'latestRoomId' => $default_room,
                    'status' => 'pending',
                ]);
                $now_time = now();
                $startTime = Carbon::parse($now_time);
                $endTime = Carbon::parse($now_time);
                $diffInSeconds = $startTime->diffInSeconds($endTime);
                $hours = floor($diffInSeconds / 3600);
                $minutes = floor(($diffInSeconds % 3600) / 60);
                $seconds = $diffInSeconds % 60;
                $totalTime = "{$hours} ชั่วโมง {$minutes} นาที {$seconds} วินาที";
                $ac_latest->update(['endTime' => $now_time, 'totalTime' => $totalTime]);
                ActiveConversations::query()->create([
                    'custId' => $customer['custId'],
                    'roomId' => $default_room,
                    'from_empCode' => 'BOT',
                    'from_roomId' => 'ROOM00',
                    'rateRef' => $current_rate['id']
                ]);
            }
            return [
                'status' => true,
                'send_to_cust' => true,
                'type_send' => 'queue',
                'type_message' => 'reply',
                'messages' => [
                    [
                        'content' => 'คิวของท่านคือ ' . $count . ' คิว กรุณารอสักครู่',
                        'contentType' => 'text'
                    ]
                ],
                'customer' => $customer,
                'ac_id' => $ac_latest['id'],
                'platform_access_token' => $platformAccessToken,
                'reply_token' => $message['reply_token'],
                'bot' => $BOT
            ];
        } catch (\Exception $e) {
            // DB::rollBack();
            Log::channel('webhook_main')->error('Error in PendingCase: ' . $e->getMessage());
        }
    }
}
