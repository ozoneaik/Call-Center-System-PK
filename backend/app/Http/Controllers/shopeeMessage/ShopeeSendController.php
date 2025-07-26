<?php

namespace App\Http\Controllers\shopeeMessage;

use App\Http\Controllers\Controller;
use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Services\PusherService;
use App\shopee\ShopeeMessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ShopeeSendController extends Controller
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
     * รับข้อความจาก Agent และส่งไปยัง Shopee
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function send(Request $request): JsonResponse
    {
        $status = 400;
        $message = 'เกิดข้อผิดพลาด';
        $detail = 'ไม่พบข้อผิดพลาด';
        $finalMessages = [];

        try {
            $custId = $request->input('custId');
            $conversationId = $request->input('conversationId');
            $messages = $request->input('messages', []);
            $files = $request->file('messages');

            foreach ($messages as $index => $msg) {
                $finalMessages[$index] = $msg;
                if (isset($files[$index]['content'])) {
                    $finalMessages[$index]['content'] = $files[$index]['content'];
                }
            }

            if (empty($finalMessages)) {
                throw new \Exception('ไม่มีข้อความหรือไฟล์ที่ต้องการส่ง');
            }

            Customers::where('custId', $custId)->firstOrFail();
            ActiveConversations::where('id', $conversationId)->firstOrFail();

            DB::beginTransaction();

            foreach ($finalMessages as $m) {
                $sendResult = $this->shopeeMessageService->sendMessage($custId, $m);
                if (!$sendResult['status']) {
                    throw new \Exception($sendResult['message'] ?? 'ส่งข้อความไป Shopee ไม่สำเร็จ');
                }

                $chatHistory = new ChatHistory();
                $chatHistory->custId = $custId;
                $chatHistory->contentType = $m['contentType'];
                $chatHistory->sender = json_encode(Auth::user());
                $chatHistory->conversationRef = $conversationId;
                $chatHistory->content = $sendResult['final_content'];
                $chatHistory->line_message_id = $sendResult['responseJson']['message_id'] ?? uniqid('shopee_');

                if (!$chatHistory->save()) {
                    throw new \Exception('ไม่สามารถบันทึก ChatHistory ได้');
                }

                $this->pusherService->sendNotification($custId);
            }

            DB::commit();
            $status = 200;
            $message = 'ส่งข้อความสำเร็จ';
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            $detail = 'ไม่พบข้อมูลลูกค้าหรือการสนทนาที่ระบุ';
            Log::channel('shopee_cron_job_log')->error('ShopeeSendController Error: ' . $detail, ['request' => $request->all()]);
        } catch (\Exception $e) {
            DB::rollBack();
            $detail = $e->getMessage();
            Log::channel('shopee_cron_job_log')->error('ShopeeSendController Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
        }

        return response()->json([
            'message' => $message,
            'detail' => $detail,
            'content' => $finalMessages,
        ], $status);
    }
}