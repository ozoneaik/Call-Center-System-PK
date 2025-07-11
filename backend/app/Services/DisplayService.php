<?php

namespace App\Services;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Rates;

class DisplayService
{
    public function MessageList($roomId, $status)
    {
        if ($status === 'progress') {
            $data = Rates::query()->leftJoin('active_conversations', 'active_conversations.rateRef', '=', 'rates.id')
                ->leftJoin('customers', 'rates.custId', 'customers.custId')
                ->leftJoin('users', 'active_conversations.empCode', 'users.empCode')
                ->leftJoin('chat_rooms', 'active_conversations.from_roomId', 'chat_rooms.roomId')
                ->where('rates.latestRoomId', $roomId)
                ->where('rates.status', $status)
                ->where('active_conversations.endTime', null)
                ->where('active_conversations.roomId', $roomId)
                ->select('chat_rooms.roomName', 'customers.custName', 'customers.avatar', 'customers.description', 'active_conversations.*', 'rates.status', 'users.name as empName')
                ->orderBy('updated_at', 'asc')
                ->get();

            foreach ($data as $key => $value) {
                $latest_message = ChatHistory::query()->select('content','sender', 'contentType', 'created_at')->where('custId', $value->custId)
                    ->orderBy('id', 'desc')
                    ->first();
                $value->latest_message = $latest_message;
                $sender_json = json_decode($latest_message->sender);
                $value->latest_message->sender = $sender_json;
            }
            return $data;
        } else {
            $data = Rates::query()->leftJoin('active_conversations', 'active_conversations.rateRef', '=', 'rates.id')
                ->leftJoin('customers', 'rates.custId', 'customers.custId')
                ->leftJoin('users', 'active_conversations.empCode', 'users.empCode')
                ->leftJoin('chat_rooms', 'active_conversations.from_roomId', 'chat_rooms.roomId')
                ->where('rates.latestRoomId', $roomId)
                ->where('rates.status', $status)
                ->where('active_conversations.receiveAt', null)
                ->where('active_conversations.roomId', $roomId)
                ->select('chat_rooms.roomName', 'customers.custName', 'customers.avatar', 'customers.description', 'active_conversations.*', 'rates.status', 'users.name as empName')
                ->orderBy('updated_at', 'asc')
                ->get();


            foreach ($data as $key => $value) {
                $latest_message = ChatHistory::query()->select('content', 'contentType', 'created_at')->where('custId', $value->custId)
                    ->orderBy('id', 'desc')
                    ->first();
                $value->latest_message = $latest_message;
            }

            return $data;
        }
    }

    public function getEmpReply($activeId)
    {
        $empName = ActiveConversations::query()->where('id', $activeId)->first();
        return $empName['empCode'];
    }

    public function selectMessage($custId)
    {
        // ดึง 200 รายการล่าสุด
        $chatHistory = ChatHistory::query()->where('custId', $custId)
            ->orderBy('id', 'desc')
            ->take(200)->get()
            ->sortBy('id')->values();

        // แปลง sender จาก JSON string เป็น array
        $chatHistory = $chatHistory->map(function ($chat) {
            // ถ้า sender มีข้อมูลเป็น JSON string ก็แปลงเป็น array
            if (is_string($chat->sender)) {
                $chat->sender = json_decode($chat->sender, true); // แปลงเป็น array
            }
            return $chat;
        });

        return $chatHistory;
    }
}
