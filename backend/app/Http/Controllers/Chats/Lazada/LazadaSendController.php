<?php

namespace App\Http\Controllers\Chats\Lazada;

use App\Http\Controllers\Controller;
use App\Models\ChatHistory;
use App\Models\ActiveConversations;
use App\Models\Customers;
use App\Services\PusherService;
use App\Services\webhooks\LazadaMessageService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class LazadaSendController extends Controller
{
    protected PusherService $pusherService;
    protected LazadaMessageService $lazadaMessageService;

    public function __construct(PusherService $pusherService, LazadaMessageService $lazadaMessageService)
    {
        $this->pusherService = $pusherService;
        $this->lazadaMessageService = $lazadaMessageService;
    }

    /**
     * รับข้อความจาก Agent และส่งไปยัง Lazada
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

            Customers::query()->where('custId', $custId)->firstOrFail();
            ActiveConversations::query()->where('id', $conversationId)->firstOrFail();
            DB::beginTransaction();

            foreach ($finalMessages as $key => &$m) {
                $chatHistory = new ChatHistory();
                $chatHistory->custId = $custId;
                $chatHistory->contentType = $m['contentType'];
                $chatHistory->sender = json_encode(Auth::user());
                $chatHistory->conversationRef = $conversationId;

                if ($m['contentType'] === 'image' && $m['content'] instanceof \Illuminate\Http\UploadedFile) {
                    $file = $m['content'];
                    $fileName = rand(0, 9999) . time() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('public/lazada-files', $fileName);

                    $publicUrl = Storage::url($path);
                    $fullUrl = asset($publicUrl);
                    Log::channel('lazada_webhook_log')->info('URL เต็ม = ' . $fullUrl);
                    Log::channel('lazada_webhook_log')->info('APP_URL จาก config(app.url) = ' . config('app.url'));
                    $m['content'] = $fullUrl;
                    $chatHistory->content = $fullUrl;
                } else {
                    $chatHistory->content = $m['content'];
                }
                if (!$chatHistory->save()) {
                    throw new \Exception('ไม่สามารถบันทึก ChatHistory ได้');
                }
                $sendResult = $this->lazadaMessageService->sendMessage($custId, $m);
                if (!$sendResult['status']) {
                    throw new \Exception($sendResult['message'] ?? 'ส่งข้อความไป Lazada ไม่สำเร็จ');
                }
                $this->pusherService->sendNotification($custId);
            }

            DB::commit();
            $status = 200;
            $message = 'ส่งข้อความสำเร็จ';
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            $detail = 'ไม่พบข้อมูลลูกค้าหรือการสนทนาที่ระบุ';
            Log::channel('lazada_webhook_log')->error('LazadaSendController Error: ' . $detail, ['request' => $request->all()]);
        } catch (\Exception $e) {
            DB::rollBack();
            $detail = $e->getMessage();
            Log::channel('lazada_webhook_log')->error('LazadaSendController Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
        }

        return response()->json([
            'message' => $message,
            'detail' => $detail,
            'content' => $finalMessages,
        ], $status);
    }
}