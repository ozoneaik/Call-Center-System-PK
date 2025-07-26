<?php

namespace App\Http\Controllers\shopeeMessage;

use App\Http\Controllers\Controller;
use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Rates;
use App\Services\PusherService;
use App\shopee\ShopeeMessageService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ShopeeReceiveController extends Controller
{
    //
    protected PusherService $pusherService;
    protected ShopeeMessageService $shopeeMessageService;

    public function __construct(PusherService $pusherService, ShopeeMessageService $shopeeMessageService)
    {
        $this->pusherService = $pusherService;
        $this->shopeeMessageService = $shopeeMessageService;
    }

    /**
     * รับเรื่องแชทจาก Shopee
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function receive(Request $request)
    {
        $status = 400;
        $detail = 'ไม่พบข้อผิดพลาด';
        $message = 'เกิดข้อผิดพลาด';

        // รับ rateId จาก request ที่ส่งมาจาก Frontend
        $rateId = $request->input('rateId');

        try {
            DB::beginTransaction();

            if (!$rateId) {
                throw new \Exception('ไม่พบ rateId');
            }

            // ค้นหา ActiveConversation ที่ยังไม่มีคนรับ โดยอ้างอิงจาก rateId
            $updateAC = ActiveConversations::where('rateRef', $rateId)->latest('id')->first();
            if (!$updateAC) {
                throw new \Exception('ไม่พบ ActiveConversation ที่รอการรับเรื่อง');
            }

            // อัปเดตข้อมูลการรับเรื่อง
            $updateAC->receiveAt = Carbon::now();
            $updateAC->startTime = Carbon::now();
            $updateAC->empCode = Auth::user()->empCode;

            if ($updateAC->save()) {
                // อัปเดตสถานะของ Rate เป็น 'progress'
                $updateRate = Rates::find($rateId);
                if (!$updateRate) {
                    throw new \Exception('ไม่พบ Rate ที่ต้องการรับเรื่อง');
                }

                $updateRate->status = 'progress';
                if ($updateRate->save()) {
                    // ส่งข้อความทักทายกลับไปหาลูกค้า
                    $this->sendMessageReceive($updateRate, $updateAC);

                    // แจ้งเตือนผ่าน Pusher
                    $this->pusherService->sendNotification($updateAC->custId, 'มีการรับเรื่อง');

                    $message = 'รับเรื่อง Shopee สำเร็จ';
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
            Log::channel('shopee_cron_job_log')->error("❌ Shopee Receive Error: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
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
    private function sendMessageReceive(Rates $rate, ActiveConversations $ac): void
    {
        $agent = auth()->user();
        $messageText = "สวัสดีค่ะ แอดมิน {$agent->name} ยินดีให้บริการค่ะ 😊";

        $messagePayload = [
            'contentType' => 'text',
            'content' => $messageText,
        ];

        // ใช้ ShopeeMessageService เพื่อส่งข้อความกลับไปหาลูกค้า
        $this->shopeeMessageService->sendMessage($rate->custId, $messagePayload);

        // บันทึกข้อความที่ส่งออกไป ลงใน ChatHistory
        ChatHistory::create([
            'custId' => $rate->custId,
            'content' => $messageText,
            'contentType' => 'text',
            'sender' => json_encode($agent),
            'conversationRef' => $ac->id,
        ]);

        Log::channel('shopee_cron_job_log')->info("📤 Sent receive message to Shopee customer: {$rate->custId}");
    }
}
