<?php

namespace App\Http\Controllers\Chats\Lazada;

use App\Http\Controllers\Controller;
use App\Models\ChatHistory;
use App\Models\ActiveConversations;
use App\Models\Customers;
use App\Services\PusherService;
use App\Services\webhooks\LazadaMessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
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
     * Handles messages sent from an agent to Lazada.
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

            if (empty($messages) && empty($files)) {
                throw new \Exception('ไม่มีข้อความหรือไฟล์ที่ต้องการส่ง');
            }

            foreach ($messages as $index => $msg) {
                $finalMessages[$index] = $msg;
            }
            
            if ($files) {
                foreach ($files as $index => $fileData) {
                    if (isset($fileData['content']) && $fileData['content'] instanceof UploadedFile) {
                        $file = $fileData['content'];
                        $mimeType = $file->getMimeType();
                        $contentType = 'file'; // Default
                        if (str_starts_with($mimeType, 'image/')) {
                            $contentType = 'image';
                        } elseif (str_starts_with($mimeType, 'video/')) {
                            $contentType = 'video';
                        }

                        if (!isset($finalMessages[$index])) {
                            $finalMessages[$index] = [];
                        }

                        $finalMessages[$index]['contentType'] = $contentType;
                        $finalMessages[$index]['content'] = $file;
                    }
                }
            }

            Customers::query()->where('custId', $custId)->firstOrFail();
            ActiveConversations::query()->where('id', $conversationId)->firstOrFail();
            
            DB::beginTransaction();

            foreach ($finalMessages as $key => &$m) {
                if (empty($m['content'])) continue;

                $chatHistory = new ChatHistory();
                $chatHistory->custId = $custId;
                $chatHistory->contentType = $m['contentType'];
                $chatHistory->sender = json_encode(Auth::user());
                $chatHistory->conversationRef = $conversationId;

                if ($m['content'] instanceof UploadedFile) {
                    $file = $m['content'];
                    $folder = ($m['contentType'] === 'video') ? 'public/lazada-videos' : 'public/lazada-images';
                    $fileName = rand(0, 9999) . time() . '.' . $file->getClientOriginalExtension();
                    
                    $path = $file->storeAs($folder, $fileName);

                    $publicUrlForHistory = $this->createPublicUrl($path);
                    $chatHistory->content = $publicUrlForHistory;

                    if ($m['contentType'] === 'image') {
                        $m['content'] = $publicUrlForHistory;
                    } elseif ($m['contentType'] === 'video') {
                        $m['content'] = storage_path('app/' . $path);
                    }
                    
                } else {
                    $chatHistory->content = $m['content'];
                }

                if (!$chatHistory->save()) {
                    throw new \Exception('ไม่สามารถบันทึก ChatHistory ได้');
                }

                Log::channel('lazada_webhook_log')->info('Attempting to send message to Lazada', [
                    'custId' => $custId,
                    'contentType' => $m['contentType'],
                    'content' => is_string($m['content']) ? $m['content'] : '[File Object]'
                ]);

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
            Log::channel('lazada_webhook_log')->error('LazadaSendController Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
        }

        foreach ($finalMessages as &$msg) {
            if ($msg['content'] instanceof UploadedFile) {
                $msg['content'] = '[File: ' . $msg['content']->getClientOriginalName() . ']';
            }
        }

        return response()->json([
            'message' => $message,
            'detail' => $detail,
            'content' => $finalMessages,
        ], $status);
    }

    private function createPublicUrl(string $storagePath): string
    {
        $relativePath = str_replace('public/', '', $storagePath);
        $baseUrl = rtrim(config('app.url', 'http://localhost'), '/');
        return $baseUrl . '/storage/' . $relativePath;
    }
}