<?php

namespace App\Services\webhooks_new;

use App\Models\ActiveConversations;
use App\Models\BotMenu;
use App\Models\ChatHistory;
use App\Services\PusherService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ProgressCase
{
    protected PusherService $pusherService;

    public function __construct(PusherService $pusherService)
    {
        $this->pusherService = $pusherService;
    }
    public function case($message, $current_rate, $customer, $platformAccessToken, $bot)
    {
        try {
            $ac_latest = ActiveConversations::query()->where('custId', $current_rate['custId'])
                ->where('rateRef', $current_rate['id'])
                ->orderBy('id', 'desc')
                ->first();
            ChatHistory::query()->create([
                'custId' => $current_rate['custId'],
                'content' => $message['content'],
                'contentType' => $message['contentType'],
                'sender' => json_encode($customer),
                'conversationRef' => $ac_latest['id'],
                'line_message_id' => $message['line_message_id'] ?? null,
                'line_quote_token' => $message['line_quote_token'] ?? null,
                'line_quoted_message_id' => $message['line_quoted_message_id'] ?? null
            ]);
            $this->pusherService->sendNotification($customer['custId']);
            // ถ้าห้องนี้ไม่ใช่ห้อง BOT
            if (!($current_rate['latestRoomId'] === 'ROOM00')) {
                Log::channel('webhook_main')->info('ปัจจุบันเป็นเคสกำลังดำเนินการอยู่');
                $this->pusherService->sendNotification($current_rate['custId']);
                return [
                    'status' => true,
                    'send_to_cust' => false,
                    'type_send' => 'normal',
                    'type_message' => 'reply',
                    'messages' => [
                        [
                            'content' => 'รับข้อความเรียบร้อยแล้ว',
                            'contentType' => 'text'
                        ]
                    ],
                    'customer' => $customer,
                    'ac_id' => $ac_latest['id'],
                    'platform_access_token' => $platformAccessToken,
                    'reply_token' => $message['reply_token'],
                    'bot' => $bot
                ];
            }
            // ถ่้าเป็นห้อง BOT
            else {
                Log::channel('webhook_main')->info('ปัจจุบันเป็นเคสกำลังดำเนินการอยู่ที่ห้อง BOT');
                $now_time = now();
                $startTime = Carbon::parse($ac_latest['startTime']);
                $endTime = Carbon::parse($now_time);
                $diffInSeconds = $startTime->diffInSeconds($endTime);
                $hours = floor($diffInSeconds / 3600);
                $minutes = floor(($diffInSeconds % 3600) / 60);
                $seconds = $diffInSeconds % 60;
                $totalTime = "{$hours} ชั่วโมง {$minutes} นาที {$seconds} วินาที";
                $ac_latest->update(['endTime' => $now_time, 'totalTime' => $totalTime]);
                // สร้างเคสใหม่ไปยังห้องแชทที่กำหนด
                if ($message['contentType'] === 'text') {
                    $menus = BotMenu::query()->where('botTokenId', $customer['platformRef'])->get();
                    $foward_to_room_id = $platformAccessToken['room_default_id'] ?? 'ROOM99';
                    foreach ($menus as $menu) {
                        if ($message['content'] == $menu['menu_number']) {
                            $foward_to_room_id = $menu['roomId'];
                            break;
                        }
                    }
                    $current_rate->update([
                        'latestRoomId' => $foward_to_room_id,
                        'status' => 'pending',
                    ]);
                    $new_ac = ActiveConversations::query()->create([
                        'custId' => $customer['custId'],
                        'roomId' => $current_rate['latestRoomId'],
                        'empCode' => $bot['empCode'],
                        'rateRef' => $current_rate['id'],
                        'from_empCode' => $bot['empCode'],
                        'from_roomId' => 'ROOM00'
                    ]);
                } else {
                    $current_rate->update([
                        'latestRoomId' => $platformAccessToken['room_default_id'] ?? 'ROOM99',
                        'status' => 'pending',
                    ]);
                    $new_ac = ActiveConversations::query()->create([
                        'custId' => $customer['custId'],
                        'roomId' => $current_rate['latestRoomId'],
                        'empCode' => $bot['empCode'],
                        'rateRef' => $current_rate['id'],
                        'from_empCode' => $bot['empCode'],
                        'from_roomId' => 'ROOM00'
                    ]);
                }
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
                    'ac_id' => $ac_latest['id'],
                    'platform_access_token' => $platformAccessToken,
                    'reply_token' => $message['reply_token'],
                    'bot' => $bot
                ];
            }
        } catch (\Exception $e) {
            Log::channel('webhook_main')->error('Error in ProgressCase: ' . $e->getMessage(), [
                'message' => json_encode($message, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
                'customer' => json_encode($customer, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
                'platformAccessToken' => json_encode($platformAccessToken, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            ]);
        }
    }
}
