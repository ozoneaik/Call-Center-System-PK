<?php
namespace App\Services;
use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Rates;

class DisplayService{
    public function MessageList($roomId,$status){
        if ($status === 'progress') {
            return  Rates::leftJoin('active_conversations', 'active_conversations.rateRef','=', 'rates.id')
                ->leftJoin('customers', 'rates.custId', 'customers.custId')
                ->leftJoin('users','active_conversations.empCode','users.empCode')
                ->leftJoin('chat_rooms','active_conversations.from_roomId','chat_rooms.roomId')
                ->where('rates.latestRoomId', $roomId)
                ->where('rates.status', $status)
                ->where('active_conversations.endTime',null)
                ->where('active_conversations.roomId', $roomId)
                ->select('chat_rooms.roomName','customers.custName','customers.avatar','customers.description', 'active_conversations.*', 'rates.status','users.name as empName')
                ->orderBy('created_at','asc')
                ->get();
        }else{
            return  Rates::leftJoin('active_conversations', 'active_conversations.rateRef','=', 'rates.id')
                ->leftJoin('customers', 'rates.custId', 'customers.custId')
                ->leftJoin('users','active_conversations.empCode','users.empCode')
                ->leftJoin('chat_rooms','active_conversations.from_roomId','chat_rooms.roomId')
                ->where('rates.latestRoomId', $roomId)
                ->where('rates.status', $status)
                ->where('active_conversations.receiveAt',null)
                ->where('active_conversations.roomId', $roomId)
                ->select('chat_rooms.roomName','customers.custName','customers.avatar','customers.description', 'active_conversations.*', 'rates.status','users.name as empName')
                ->orderBy('created_at','asc')
                ->get();
        }
    }

    public function getEmpReply($activeId){
        $empName = ActiveConversations::where('id', $activeId)->first();
        return $empName['empCode'];
    }

    public function selectMessage($custId)
    {
        // ดึง 100 รายการล่าสุด
        $chatHistory = ChatHistory::where('custId', $custId)
            ->orderBy('id', 'desc')
            ->take(100)->get()
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
