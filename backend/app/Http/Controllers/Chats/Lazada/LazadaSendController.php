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

    public function __construct(PusherService $pusherService)
    {
        $this->pusherService = $pusherService;
    }

    public function send(Request $request): JsonResponse
    {
        $detail = 'ไม่พบข้อผิดพลาด';
        $custId = $request->input('custId');
        $conversationId = $request->input('conversationId');
        $messages = $request->input('messages', []);
        $files = $request->file('messages', []);

        $status = 400;
        $message = 'เกิดข้อผิดพลาด';

        $processedMessages = [];
        foreach ($messages as $index => $msg) {
            $processedMessages[$index] = $msg;
            if (isset($files[$index]['content'])) {
                $processedMessages[$index]['content'] = $files[$index]['content'];
            }
        }

        try {
            if (empty($processedMessages)) {
                throw new \Exception('ไม่มีข้อความหรือไฟล์ที่ต้องการส่ง');
            }

            $checkCustId = Customers::query()->where('custId', $custId)->first();
            if (!$checkCustId) throw new \Exception('ไม่พบลูกค้าที่ต้องการส่งข้อความ');

            DB::beginTransaction();

            $checkConversation = ActiveConversations::query()->where('id', $conversationId)->first();
            if (!$checkConversation) throw new \Exception('ไม่พบ Active Conversation');

            foreach ($processedMessages as $key => $m) {
                $chat = new ChatHistory();
                $chat->custId = $custId;
                $chat->contentType = $m['contentType'];

                // จัดการไฟล์ (image, video, file)
                // if (in_array($m['contentType'], ['image', 'video', 'file']) && isset($m['content']) && $m['content'] instanceof \Illuminate\Http\UploadedFile) {
                //     $file = $m['content'];
                //     $fileName = rand(1000, 9999) . time() . '.' . $file->getClientOriginalExtension();
                //     $path = $file->storeAs('public/lazada-files', $fileName);
                //     $relativePath = Storage::url(str_replace('public/', '', $path));
                //     $fullUrl = env('APP_URL') . $relativePath;

                //     // อัปเดต content ให้เป็น URL ของไฟล์
                //     $m['content'] = $fullUrl;
                //     $chat->content = $fullUrl;
                // } else {
                if (in_array($m['contentType'], ['image', 'video', 'file']) && isset($m['content']) && $m['content'] instanceof \Illuminate\Http\UploadedFile) {
                    $file = $m['content'];
                    $fileName = rand(1000, 9999) . time() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('public/lazada-files', $fileName);

                    $publicUrl = Storage::url($path);
                    $localPath = Storage::path($path);
                    $m['content'] = $localPath;
                    $chat->content = $publicUrl;
                } else {
                    $chat->content = $m['content'];
                }

                $chat->sender = json_encode(Auth::user());
                $chat->conversationRef = $conversationId;

                if (!$chat->save()) {
                    throw new \Exception('ไม่สามารถบันทึก ChatHistory ได้');
                }

                $sendResult = app(LazadaMessageService::class)->sendMessage($custId, $m);

                if (!$sendResult['status']) {
                    throw new \Exception($sendResult['message'] ?? 'ส่งข้อความไป Lazada ไม่สำเร็จ');
                }

                $this->pusherService->sendNotification($custId);
                $processedMessages[$key]['content'] = $m['content'];
            }

            DB::commit();
            $status = 200;
            $message = 'ส่งข้อความสำเร็จ';
        } catch (\Exception $e) {
            DB::rollBack();
            $detail = $e->getMessage();
            Log::error('❌ LazadaSendController Error: ' . $e->getMessage());
        }

        return response()->json([
            'message' => $message,
            'detail' => $detail,
            'content' => $processedMessages,
        ], $status);
    }
}
