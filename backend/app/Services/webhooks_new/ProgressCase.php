<?php

namespace App\Services\webhooks_new;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Services\PusherService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ProgressCase
{
    protected PusherService $pusherService;
    protected BotReplyMessage $botReplyMessage;
    protected ReplyMessage $replyMessage;

    public function __construct(PusherService $pusherService, BotReplyMessage $botReplyMessage, ReplyMessage $replyMessage)
    {
        $this->pusherService = $pusherService;
        $this->botReplyMessage = $botReplyMessage;
        $this->replyMessage = $replyMessage;
    }
    public function case($message, $current_rate, $customer, $platformAccessToken, $bot)
    {
        try {
            // ถ้าห้องนี้ไม่ใช่ห้อง BOT
            if (!($current_rate['latestRoomId'] === 'ROOM00')) {
                Log::channel('webhook_main')->info('ปัจจุบันเป็นเคสกำลังดำเนินการอยู่');
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
                $this->pusherService->sendNotification($current_rate['custId']);
            }
            // ถ่้าเป็นห้อง BOT
            else {
                Log::channel('webhook_main')->info('ปัจจุบันเป็นเคสกำลังดำเนินการอยู่ที่ห้อง BOT');
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
                $msg_redirect = $this->format_message($platformAccessToken['platform']);
                $reply_token = $message['reply_token'] ?? null;
                $bot_send_msg = $this->replyMessage->reply($msg_redirect, $platformAccessToken, $bot, $customer, $reply_token);
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
                        'conversationRef' => $ac_latest['id'],
                        'line_message_id' => $bot_send_msg['response']['line_message_id'] ?? null,
                        'line_quote_token' => $bot_send_msg['response']['line_quote_token'] ?? null,
                    ]);
                    // $this->pusherService->sendNotification($customer['custId']);
                    // ปิดเคสบอท

                    $now_time = now();
                    $startTime = Carbon::parse($ac_latest['startTime']);
                    $endTime = Carbon::parse($now_time);
                    $diffInSeconds = $startTime->diffInSeconds($endTime);
                    $hours = floor($diffInSeconds / 3600);
                    $minutes = floor(($diffInSeconds % 3600) / 60);
                    $seconds = $diffInSeconds % 60;
                    $totalTime = "{$hours} ชั่วโมง {$minutes} นาที {$seconds} วินาที";
                    $ac_latest->update([
                        'endTime' => $now_time,
                        'totalTime' => $totalTime,
                    ]);
                    // สร้างเคสใหม่ไปยังห้องแชทที่กำหนด
                    if ($message['contentType'] === 'text') {
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
                }
                $this->pusherService->sendNotification($customer['custId']);
            }
        } catch (\Exception $e) {
            Log::channel('webhook_main')->error('Error in ProgressCase: ' . $e->getMessage(), [
                'message' => json_encode($message, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
                'customer' => json_encode($customer, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
                'platformAccessToken' => json_encode($platformAccessToken, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            ]);
        }
    }

    private function format_message($platform)
    {
        switch (strtoupper($platform)) {
            case 'LINE':
                return [[
                    'type' => 'text',
                    'text' => 'ระบบกำลังส่งต่อให้เข้าหน้าที่ กรุณารอซักครู่'
                ]];
                break;
            default:
                return [
                    'type' => 'text',
                    'text' => 'ไม่รู้'
                ];
                break;
        }
    }
}
