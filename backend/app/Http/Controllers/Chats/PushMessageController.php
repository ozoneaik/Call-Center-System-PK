<?php

namespace App\Http\Controllers\Chats;

use App\Http\Controllers\Controller;
use App\Http\Requests\sendMessageRequest;
use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\Services\PusherService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class PushMessageController extends Controller
{

    protected PusherService $pusherService;

    public function __construct(PusherService $pusherService)
    {
        $this->pusherService = $pusherService;
    }
    public function pushMessage(sendMessageRequest $request)
    {
        $detail = 'ไม่พบข้อผิดพลาด';
        $custId = $request['custId'];
        $conversationId = $request['conversationId'];
        $messages = $request['messages'];

        try {
            $checkCustId = Customers::query()->where('custId', $custId)->first();
            if (!$checkCustId) throw new \Exception('ไม่พบลูกค้าที่ต้องการส่งข้อความไปหา');
            $platformAccessToken = PlatformAccessTokens::query()->where('id', $checkCustId['platformRef'])->first();

            DB::beginTransaction();

            $checkConversation = ActiveConversations::query()->where('id', $conversationId)->first();
            if (!$checkConversation) throw new \Exception('ไม่พบ active Id');

            if (!empty($checkConversation['receiveAt']) && empty($checkConversation['startTime'])) {
                $checkConversation['startTime'] = Carbon::now();
                $notification = $this->pusherService->newMessage(null, false, 'เริ่มสนทนาแล้ว');
                if (!$notification['status']) throw new \Exception('การแจ้งเตือนผิดพลาด');
                if (!$checkConversation->save()) throw new \Exception('เจอปัญหา startTime ไม่ได้');
            }

            $messages_formatted = [];

            foreach ($messages as $key => $m) {
                $storeChatHistory = new ChatHistory();
                $storeChatHistory['custId'] = $custId;
                $storeChatHistory['contentType'] = $m['contentType'];

                if (in_array($storeChatHistory['contentType'], ['image', 'video', 'file'])) {
                    $file = $m['content'];
                    $extension = '.' . $file->getClientOriginalExtension();
                    $mediaId = rand(0, 9999) . time();
                    $mediaPath = $mediaId . $extension;

                    $mediaContent = file_get_contents($file->getRealPath());
                    $contentType = $file->getClientMimeType();

                    Storage::disk('s3')->put($mediaPath, $mediaContent, [
                        'visibility'  => 'private',
                        'ContentType' => $contentType,
                    ]);

                    $url = Storage::disk('s3')->url($mediaPath);
                    $m['content'] = $url;
                    $storeChatHistory['content'] = $url;
                } else {
                    $storeChatHistory['content'] = $m['content'];
                }

                $storeChatHistory['sender'] = json_encode(Auth::user());
                $storeChatHistory['conversationRef'] = $conversationId;

                if (!$storeChatHistory->save()) {
                    throw new \Exception('สร้าง ChatHistory ไม่สำเร็จ');
                }

                // ส่งข้อความไป LINE
                $lineResponse = $this->pushMessageByLine(
                    [$this->formatLineMessage($m)],
                    $platformAccessToken['accessToken'],
                    $custId
                );

                // ถ้า LINE ส่งสำเร็จ → ส่ง pusher
                if ($lineResponse['status'] === true) {
                    $this->pusherService->sendNotification($custId);
                }else{
                    throw new \Exception($lineResponse['response']['message']);
                }
            }

            DB::commit();
            $status = 200;
            $message = 'ส่งข้อความสำเร็จ';
        } catch (\Exception $e) {
            DB::rollBack();
            $detail = $e->getMessage();
            $status = 400;
            $message = 'เกิดข้อผิดพลาด';
        }

        return response()->json([
            'message' => $message ?? 'เกิดข้อผิดพลาด',
            'detail'  => $detail,
            'content' => $messages ?? [],
        ], $status);
    }

    private function formatLineMessage($message)
    {
        if ($message['contentType'] === 'text') {
            return [
                'type' => 'text',
                'text' => $message['content']
            ];
        } elseif ($message['contentType'] === 'file') {
            return [
                'type' => 'template',
                'altText' => 'ส่งไฟล์',
                'template' => [
                    'type' => 'buttons',
                    'thumbnailImageUrl' => "https://images.pumpkin.tools/icon/pdf_icon.png",
                    'imageAspectRatio' => "rectangle",
                    'imageSize' => "cover",
                    'text' => "ไฟล์.pdf",
                    'actions' => [
                        [
                            'type' => "uri",
                            'label' => "ดูไฟล์",
                            'uri' => $message['content'] ?? 'https://example.com/default.pdf'
                        ]
                    ]
                ]
            ];
        } elseif (in_array($message['contentType'], ['image', 'sticker'])) {
            return [
                'type' => 'image',
                'originalContentUrl' => $message['content'],
                'previewImageUrl' => $message['content']
            ];
        } elseif ($message['contentType'] === 'video') {
            return [
                'type' => 'video',
                'originalContentUrl' => $message['content'],
                'previewImageUrl' => $message['content']
            ];
        } elseif ($message['contentType'] === 'audio') {
            return [
                'type' => 'audio',
                'originalContentUrl' => $message['content'],
                'duration' => 6000
            ];
        }
        return [];
    }

    private function pushMessageByLine($messages, $platformAccessToken, $custId)
    {
        $url = 'https://api.line.me/v2/bot/message/push';
        $body = [
            'to' => $custId,
            'messages' => $messages
        ];
        $headers = [
            'Authorization' => 'Bearer ' . $platformAccessToken,
            'Content-Type' => 'application/json',
        ];

        $response = Http::withHeaders($headers)->post($url, $body);
        return [
            'status' => $response->successful(),
            'response' => $response->json()
        ];
    }
}
