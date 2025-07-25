<?php

namespace App\Services\webhooks_new;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Services\PusherService;
use Illuminate\Support\Facades\Log;

class ProgressCase
{
    protected PusherService $pusherService;

    public function __construct(PusherService $pusherService)
    {
        $this->pusherService = $pusherService;
    }
    public function case($message,$current_rate, $customer, $platformAccessToken,$bot){
        try{
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
            }else{
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
            }
            $this->pusherService->sendNotification($customer['custId']);
        }catch (\Exception $e){
            Log::channel('webhook_main')->error('Error in ProgressCase: ' . $e->getMessage(), [
                'message' => json_encode($message, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
                'customer' => json_encode($customer, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
                'platformAccessToken' => json_encode($platformAccessToken, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            ]);
        }
    }
}