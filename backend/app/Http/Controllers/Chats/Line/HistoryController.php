<?php

namespace App\Http\Controllers\Chats\Line;

use App\Http\Controllers\Controller;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use Illuminate\Http\Request;

class HistoryController extends Controller
{
    public function ChatHistory(Request $request){
        $query = Customers::query();
        if (isset($request['custName']) && $request['custName'] !== null) {
            $message = 'ค้นหาชื่อผู้ใช้';
            $query->where('custName', 'ILIKE', '%' . $request['custName'] . '%');
        }

        if (isset($request['directFrom']) && $request['directFrom'] !== null) {
            $message = 'ค้นหาจากแหล่งที่มา';
            $query->where('platformRef','ILIKE',$request['directFrom']);
        }

        if(isset($request['firstContactDate']) && $request['firstContactDate'] !== null) {
            $message = 'ค้นหาจากวันที่';
            $query->whereDate('created_at', $request['firstContactDate']);
        }

        $customer_list = $query->orderBy('created_at', 'desc')->paginate(1000);
        foreach ($customer_list as $customer) {
            $customer->latest_message = ChatHistory::query()
                ->select('content', 'contentType', 'created_at')
                ->where('custId', $customer->custId)
                ->orderBy('id', 'desc')
                ->first();
        }

        $platforms = PlatformAccessTokens::all();

        return response()->json([
            'message' => $message ?? 'ดึงข้อมูลสำเร็จ',
            'list' => $customer_list,
            'platforms' => $platforms,
            'request' => $request->all(),
        ]);
    }

    public function ChatHistoryDetail($custId){
        $status = 400;
        try {
            // ดึง 500 รายการล่าสุด (id มากไปน้อย)
            $chatHistory = ChatHistory::query()->where('custId', $custId)->orderBy('id', 'desc')->limit(500)->get();
            // จากนั้นกลับลำดับ (น้อยไปมาก)
            $chatHistory = $chatHistory->sortBy('id')->values();
            $customer = Customers::query()->where('custId', $custId)->first();
            return response()->json([
                'message' => 'ดึงข้อมูลสำเร็จ',
                'data' => [
                    'chatHistory' => $chatHistory,
                    'customer' => $customer,
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
