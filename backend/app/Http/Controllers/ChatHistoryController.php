<?php

namespace App\Http\Controllers;

use App\Models\chatHistory;
use App\Models\customers;
use App\Services\ChatHistoryService;
use Illuminate\Http\JsonResponse;

class ChatHistoryController extends Controller
{
    protected ChatHistoryService $chatHistoryService;
    public function __construct(ChatHistoryService $chatHistoryService){
        $this->chatHistoryService = $chatHistoryService;
    }

    public function LatestChatHistory() : JsonResponse{
        $customers = customers::all();
        $data = [];
        foreach ($customers as $index => $customer) {
            // สร้างข้อมูลพื้นฐานสำหรับแต่ละ customer
            $data[$index]['id'] = $index;

            // ดึงข้อมูลของ customer จากฐานข้อมูล
            $customerDetails = customers::where('custId', $customer->custId)->first();

            // แปลงข้อมูล customer เป็น JSON
            $data[$index]['sender'] = $customerDetails ? $customerDetails->toArray() : null;

            // ดึงข้อมูล chatHistory และแปลง sender เป็น JSON
            $chatHistories = chatHistory::where('custId', $customer->custId)
                ->orderBy('id', 'asc')
                ->get();

            // แปลงข้อมูล chatHistory เป็น array พร้อมแปลง sender เป็น JSON
            $data[$index]['messages'] = $chatHistories->map(function ($chatHistory) {
                $chatHistoryArray = $chatHistory->toArray();
                $chatHistoryArray['sender'] = json_decode($chatHistory->sender);
                return $chatHistoryArray;
            });

        }
        return response()->json([
            'message' => "สำเร็จ",
            'chats' => $data
        ]);
    }
}
