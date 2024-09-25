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

    public function ChatSelectById($id): JsonResponse
    {
        // ดึงข้อมูลลูกค้าจาก customers table
        $customerDetails = customers::where('custId', $id)->first();
        $data['sender'] = $customerDetails ? $customerDetails->toArray() : null;

        // ดึง 100 ข้อความล่าสุดโดยเรียงจาก id มากไปน้อย
        $chatHistories = chatHistory::where('custId', $id)->orderBy('id', 'desc')->take(100)->get()->values();
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
