<?php

namespace App\Http\Controllers\Chats\Line;

use App\Http\Controllers\Controller;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\Models\Rates;
use Illuminate\Http\Request;

class HistoryController extends Controller
{
    // public function ChatHistory(Request $request)
    // {
    //     $query = Customers::query();
    //     if (isset($request['custName']) && $request['custName'] !== null) {
    //         $message = 'ค้นหาชื่อผู้ใช้';
    //         $query->where('custName', 'ILIKE', '%' . $request['custName'] . '%');
    //     }

    //     if (isset($request['directFrom']) && $request['directFrom'] !== null) {
    //         $message = 'ค้นหาจากแหล่งที่มา';
    //         $query->where('platformRef', 'ILIKE', $request['directFrom']);
    //     }

    //     if (isset($request['firstContactDate']) && $request['firstContactDate'] !== null) {
    //         $message = 'ค้นหาจากวันที่';
    //         $query->whereDate('created_at', $request['firstContactDate']);
    //     }

    //     $customer_list = $query->orderBy('created_at', 'desc')->paginate(200);
    //     foreach ($customer_list as $customer) {
    //         $customer->latest_message = ChatHistory::query()
    //             ->select('content', 'contentType', 'created_at')
    //             ->where('custId', $customer->custId)
    //             ->orderBy('id', 'desc')
    //             ->first();
    //     }

    //     $platforms = PlatformAccessTokens::all();

    //     return response()->json([
    //         'message' => $message ?? 'ดึงข้อมูลสำเร็จ',
    //         'list' => $customer_list,
    //         'platforms' => $platforms,
    //         'request' => $request->all(),
    //     ]);
    // }

    //เพิ่มการแสดงชื่อของพนักงานที่คุยล่าสุด
    // public function ChatHistory(Request $request)
    // {
    //     $query = Customers::query();

    //     if ($request->filled('custId')) {
    //         $message = 'ค้นหาด้วยรหัสลูกค้า';
    //         $query->where('id', $request->custId);
    //     }

    //     if ($request->filled('custName')) {
    //         $message = 'ค้นหาชื่อผู้ใช้';
    //         $query->where('custName', 'ILIKE', '%' . $request->custName . '%');
    //     }

    //     if ($request->filled('directFrom')) {
    //         $message = 'ค้นหาจากแหล่งที่มา';
    //         $query->where('platformRef', 'ILIKE', $request->directFrom);
    //     }

    //     if ($request->filled('firstContactDate')) {
    //         $message = 'ค้นหาจากวันที่';
    //         $query->whereDate('created_at', $request->firstContactDate);
    //     }
    //     $customer_list = $query->orderBy('created_at', 'desc')->paginate(200);

    //     foreach ($customer_list as $customer) {
    //         $latestMessage = ChatHistory::query()
    //             ->select(
    //                 'chat_histories.content',
    //                 'chat_histories.contentType',
    //                 'chat_histories.created_at',
    //                 'users.name as staff_name',
    //                 'users.empCode'
    //             )
    //             ->where('chat_histories.custId', $customer->custId)
    //             ->leftJoin('active_conversations', 'active_conversations.id', '=', 'chat_histories.conversationRef')
    //             ->leftJoin('users', 'users.empCode', '=', 'active_conversations.empCode')
    //             ->orderBy('chat_histories.id', 'desc')
    //             ->first();

    //         $customer->latest_message    = $latestMessage;
    //         $customer->latest_staff_name = $latestMessage?->staff_name;
    //         $customer->latest_empCode    = $latestMessage?->empCode;
    //     }

    //     $platforms = PlatformAccessTokens::all();

    //     return response()->json([
    //         'message'   => $message ?? 'ดึงข้อมูลสำเร็จ',
    //         'list'      => $customer_list,
    //         'platforms' => $platforms,
    //         'request'   => $request->all(),
    //     ]);
    // }

    public function ChatHistory(Request $request)
    {
        $query = Customers::query();

        if ($request->filled('custId')) {
            $message = 'ค้นหาด้วยรหัสลูกค้า';
            $query->where('id', $request->custId);
        }

        if ($request->filled('custName')) {
            $message = 'ค้นหาชื่อผู้ใช้';
            $query->where('custName', 'ILIKE', '%' . $request->custName . '%');
        }

        if ($request->filled('directFrom')) {
            $message = 'ค้นหาจากแหล่งที่มา';
            $query->where('platformRef', 'ILIKE', $request->directFrom);
        }

        if ($request->filled('firstContactDate')) {
            $message = 'ค้นหาจากวันที่';
            $query->whereDate('created_at', $request->firstContactDate);
        }

        // เพิ่มการค้นหาด้วย NOTE (join กับตาราง notes)
        if ($request->filled('note')) {
            $message = 'ค้นหาจากหมายเหตุ (NOTE)';
            $query->leftJoin('notes', 'notes.custId', '=', 'customers.custId')
                ->where('notes.text', 'ILIKE', '%' . $request->note . '%')
                ->select('customers.*'); // ป้องกันคอลัมน์ซ้ำจาก notes
        }

        $customer_list = $query->orderBy('customers.created_at', 'desc')->paginate(200);

        foreach ($customer_list as $customer) {
            $latestMessage = ChatHistory::query()
                ->select(
                    'chat_histories.content',
                    'chat_histories.contentType',
                    'chat_histories.created_at',
                    'users.name as staff_name',
                    'users.empCode'
                )
                ->where('chat_histories.custId', $customer->custId)
                ->leftJoin('active_conversations', 'active_conversations.id', '=', 'chat_histories.conversationRef')
                ->leftJoin('users', 'users.empCode', '=', 'active_conversations.empCode')
                ->orderBy('chat_histories.id', 'desc')
                ->first();

            $customer->latest_message    = $latestMessage;
            $customer->latest_staff_name = $latestMessage?->staff_name;
            $customer->latest_empCode    = $latestMessage?->empCode;
        }

        $platforms = PlatformAccessTokens::all();

        return response()->json([
            'message'   => $message ?? 'ดึงข้อมูลสำเร็จ',
            'list'      => $customer_list,
            'platforms' => $platforms,
            'request'   => $request->all(),
        ]);
    }

    public function ChatHistoryDetail($custId)
    {
        $status = 400;
        try {
            // ดึง 500 รายการล่าสุด (id มากไปน้อย)
            $chatHistory = ChatHistory::query()->where('custId', $custId)->orderBy('id', 'desc')->limit(500)->get();
            // จากนั้นกลับลำดับ (น้อยไปมาก)
            $chatHistory = $chatHistory->sortBy('id')->values();
            $customer = Customers::query()->where('custId', $custId)->first();
            $current_rate = Rates::query()
                ->leftJoin('chat_rooms', 'chat_rooms.roomId', '=', 'rates.latestRoomId')
                ->where('rates.custId', $custId)->orderBy('rates.id', 'desc')
                ->select('rates.*', 'chat_rooms.roomName')
                ->first();
            return response()->json([
                'message' => 'ดึงข้อมูลสำเร็จ',
                'data' => [
                    'chatHistory' => $chatHistory,
                    'customer' => $customer,
                    'current_rate' => $current_rate,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'data' => [],
            ], $status ?? 500);
        }
    }
}
