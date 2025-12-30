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
                ->select('chat_rooms.roomName', 'customers.custName', 'customers.avatar', 'customers.id AS pcust_id', 'customers.description', 'active_conversations.*', 'rates.status', 'users.name as empName')
                ->orderBy('updated_at', 'asc')
                ->get();

            foreach ($data as $key => $value) {
                $latest_message = ChatHistory::query()->select('content','sender', 'contentType', 'created_at', 'is_read')->where('custId', $value->custId)
                    ->orderBy('id', 'desc')
                    ->first();
                $value->latest_message = $latest_message;
                $value->isUnread = false;
                $value->unread_count = 0;

                if ($latest_message) {
                    $sender_json = json_decode($latest_message->sender, true);
                    $value->latest_message->sender = $sender_json;

                    // เช็ค: ถ้าคนส่งคือลูกค้า (มี custId) AND ยังไม่ได้อ่าน (is_read เป็น false/null)
                    if (isset($sender_json['custId']) && empty($latest_message->is_read)) {
                        $value->isUnread = true;

                        $value->unread_count = ChatHistory::query()
                            ->where('custId', $value->custId)
                            ->where(function ($q) {
                                $q->where('is_read', false)->orWhereNull('is_read');
                            })
                            // เช็คว่าเป็นข้อความจากลูกค้า (มี key "custId" ใน json sender)
                            ->where('sender', 'like', '%"custId"%') 
                            ->count();
                    }
                }
                // แปลง sender จาก JSON string เป็น array
                // $sender_json = json_decode($latest_message->sender);
                // $value->latest_message->sender = $sender_json;
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
                ->select('chat_rooms.roomName', 'customers.custName', 'customers.avatar', 'customers.id AS pcust_id', 'customers.description', 'active_conversations.*', 'rates.status', 'users.name as empName')
                ->orderBy('updated_at', 'asc')
                ->get();


            foreach ($data as $key => $value) {
                $latest_message = ChatHistory::query()->select('content', 'contentType', 'created_at', 'is_read')->where('custId', $value->custId)
                    ->orderBy('id', 'desc')
                    ->first();
                $value->latest_message = $latest_message;
                $value->isUnread = false;
                $value->unread_count = 0;

                if ($latest_message) {
                    $sender_json = is_string($latest_message->sender) ? json_decode($latest_message->sender, true) : $latest_message->sender;
                    $value->latest_message->sender = $sender_json;
                    
                    if (isset($sender_json['custId']) && empty($latest_message->is_read)) {
                        $value->isUnread = true;

                        $value->unread_count = ChatHistory::query()
                            ->where('custId', $value->custId)
                            ->where(function ($q) {
                                $q->where('is_read', false)->orWhereNull('is_read');
                            })
                            ->where('sender', 'like', '%"custId"%')
                            ->count();
                    }
                }
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
