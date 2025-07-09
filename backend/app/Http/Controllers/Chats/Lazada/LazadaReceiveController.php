<?php

namespace App\Http\Controllers\Chats\Lazada;

use App\Http\Controllers\Controller;
use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Rates;
use App\Services\PusherService;
use App\Services\webhooks\LazadaMessageService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class LazadaReceiveController extends Controller
{
    protected PusherService $pusherService;

    public function __construct(PusherService $pusherService)
    {
        $this->pusherService = $pusherService;
    }

    public function receive(Request $request)
    {
        $status = 400;
        $detail = 'ไม่พบข้อผิดพลาด';
        $message = 'เกิดข้อผิดพลาด';

        // รับ rateId จาก request ที่ส่งมาจาก Frontend
        $rateId = $request['rateId'];

        try {
            DB::beginTransaction();

            if (!$rateId) {
                throw new \Exception('ไม่พบ rateId');
            }

            // ค้นหา ActiveConversation ที่ยังไม่มีคนรับ
            $updateAC = ActiveConversations::query()->where('rateRef', $rateId)->orderBy('id', 'desc')->first();
            if (!$updateAC) {
                throw new \Exception('ไม่พบ ActiveConversation ที่รอการรับเรื่อง');
            }

            // อัปเดตข้อมูลการรับเรื่อง
            $updateAC->receiveAt = Carbon::now();
            $updateAC->startTime = Carbon::now();
            $updateAC->empCode = auth()->user()->empCode;
            
            if ($updateAC->save()) {
                // อัปเดตสถานะของ Rate เป็น 'progress'
                $updateRate = Rates::query()->where('id', $rateId)->first();
                if (!$updateRate) {
                    throw new \Exception('ไม่พบ Rate ที่ต้องการรับเรื่อง');
                }
                
                $updateRate->status = 'progress';
                if ($updateRate->save()) {
                    // ส่งข้อความทักทายกลับไปหาลูกค้า
                    $this->sendMessageReceive($updateRate, $updateAC);
                    
                    // แจ้งเตือนผ่าน Pusher (ถ้ามี)
                    $this->pusherService->sendNotification($updateAC->custId, 'มีการรับเรื่อง Lazada');
                    
                    $message = 'รับเรื่อง Lazada สำเร็จ';
                    $status = 200;
                } else {
                    throw new \Exception('ไม่สามารถอัปเดตสถานะ Rate ได้');
                }
            } else {
                throw new \Exception('ไม่สามารถอัปเดตสถานะ ActiveConversation ได้');
            }

            DB::commit();
        } catch (\Exception $e) {
            $detail = $e->getMessage();
            $status = 400;
            DB::rollBack();
            Log::error("❌ Lazada Receive Error: " . $e->getMessage());
        } finally {
            return response()->json([
                'message' => $message,
                'detail' => $detail,
            ], $status);
        }
    }

    /**
     * สร้างและส่งข้อความทักทายเมื่อรับเรื่อง
     */
    private function sendMessageReceive($rate, $ac)
    {
        $agent = auth()->user();
        $messageText = "สวัสดีค่ะ แอดมิน {$agent->name} ยินดีให้บริการค่ะ 😊";
        
        // ใช้ LazadaMessageService เพื่อส่งข้อความกลับไปหาลูกค้า
        LazadaMessageService::sendReply($rate->custId, $messageText);

        // บันทึกข้อความที่ส่งออกไป ลงใน ChatHistory
        ChatHistory::query()->create([
            'custId' => $rate->custId,
            'content' => $messageText,
            'contentType' => 'text',
            'sender' => json_encode($agent),
            'conversationRef' => $ac->id,
        ]);

        Log::info("📤 Sent receive message to Lazada customer: {$rate->custId}");
    }
}