<?php

namespace App\Http\Controllers;

use App\Models\chatHistory;
use App\Models\customers;
use App\Services\ChatHistoryService;
use Illuminate\Http\JsonResponse;

class ChatHistoryController extends Controller
{
    protected ChatHistoryService $chatHistoryService;

    public function __construct(ChatHistoryService $chatHistoryService)
    {
        $this->chatHistoryService = $chatHistoryService;
    }

    public function LatestChatHistory($id): JsonResponse
    {
        $customers = customers::where('roomId', $id)->orderBy('id', 'desc')->get();
        $data[0]['id'] = 0;
        foreach ($customers as $index => $customer) {
            // สร้างข้อมูลพื้นฐานสำหรับแต่ละ customer
            $data[$index+1]['id'] = $index+1;
            // ดึงข้อมูลของ customer จากฐานข้อมูล
            $customerDetails = customers::where('custId', $customer->custId)->first();
            // แปลงข้อมูล customer เป็น JSON
            $data[$index+1]['sender'] = $customerDetails ? $customerDetails->toArray() : null;
            // ดึงข้อมูล chatHistory และแปลง sender เป็น JSON
            $chatHistories = chatHistory::where('custId', $customer->custId)->orderBy('id', 'desc')->first();
            // แปลงข้อมูล chatHistory เป็น array พร้อมแปลง sender เป็น JSON
            $data[$index+1]['messages'][] = json_decode($chatHistories);
        }

        return response()->json([
            'message' => "สำเร็จ",
            'chats' => $data
        ]);
    }

    public function ChatSelectById($id): JsonResponse
    {
        // ดึงข้อมูลลูกค้าจาก customers table
        $customerDetails = customers::where('custId', $id)->first();
        $data['sender'] = $customerDetails ? $customerDetails->toArray() : null;

        // ดึง 10 ข้อความล่าสุดโดยเรียงจาก id มากไปน้อย
        $chatHistories = chatHistory::where('custId', $id)
            ->orderBy('id', 'desc')
            ->take(100)
            ->get()
            ->values(); // Ensure the data stays as array and doesn't turn into an object

        // Map ข้อมูลแชทและ decode sender
        $data['messages'] = $chatHistories->map(function ($chatHistory) {
            $chatHistoryArray = $chatHistory->toArray();
            $chatHistoryArray['sender'] = json_decode($chatHistory->sender);
            return $chatHistoryArray;
        })->sortBy('id')->values(); // sortBy แล้วใช้ values เพื่อให้ยังคงเป็น array

        // ส่ง response กลับในรูปแบบ JSON
        return response()->json([
            'message' => "สำเร็จ",
            'chats' => $data
        ]);
    }


}
