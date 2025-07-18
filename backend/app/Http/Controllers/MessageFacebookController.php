<?php

namespace App\Http\Controllers;

use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\Models\User;
use App\Services\Facebook\FacebookService;
use App\Services\PusherService;
use Illuminate\Contracts\Queue\Queue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use React\Dns\Query\Query;

class MessageFacebookController extends Controller
{
    protected FacebookService $facebookService;
    protected PusherService $pusherService;

    public function __construct(FacebookService $facebookService, PusherService $pusherService)
    {
        $this->facebookService = $facebookService;
        $this->pusherService = $pusherService;
    }

    public function sendTextToFacebook(Request $request)
    {
        try {
            $acId = $request->input('conversationId');
            $custId = $request->input('custId');
            $messages = $request['messages'];

            if (!$custId || empty($messages)) {
                return response()->json(['success' => false, 'message' => 'Missing required fields'], 422);
            }

            $res_msg = '';

            $customer = $this->getCustomerByCustId($custId);
            if (!$customer) {
                return response()->json(['success' => false, 'message' => 'Customer not found'], 404);
            }
            $senderId = $customer->fb_page_id;
            $accessToken = $customer->accessToken;

            foreach ($messages as $key => $m) {
                if ($m['contentType'] === 'image' || $m['contentType'] === 'video' || $m['contentType'] === 'file') {
                    $file = $m['content'];
                    $fileName = rand(0, 9999) . time() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('public/facebook-files', $fileName);
                    $relativePath = Storage::url(str_replace('public/', '', $path));
                    $res_msg .= "ส่งไฟล์ $key ";
                    $fullUrl = env('APP_WEBHOOK_URL') . $relativePath;
                    $m['content'] = $fullUrl;
                    $this->facebookService->sendTextMessage($senderId, $custId, $m, $accessToken);
                    $this->storeChatHistory($custId, $m, $acId);
                } else {
                    $this->facebookService->sendTextMessage($senderId, $custId, $m, $accessToken);
                    $this->storeChatHistory($custId, $m, $acId);
                    $res_msg .= "ส่งข้อความ $key ";
                }
                $this->pusherService->sendNotification($custId);
            }
            return response()->json(['success' => true, 'message' => 'Message sent successfully']);

            // ---------------------------------------------------------------------------------------------
            $customer = $this->getCustomerByCustId($custId);
            if (!$customer) {
                return response()->json(['success' => false, 'message' => 'Customer not found'], 404);
            }

            $senderId = $customer->fb_page_id;
            $accessToken = $customer->accessToken;
            $message = $messages[0];

            return response()->json([
                'messages' => $messages,
                'fb_page_id' => $senderId,
                'accessToken' => $accessToken,
                'custId' => $custId
            ], 400);



            $this->storeChatHistory($custId, $message, $acId);

            $this->pusherService->sendNotification($custId);

            return response()->json(['success' => true, 'message' => 'Message sent successfully']);
        } catch (\Exception $e) {
            Log::error('❌ Failed to send Facebook message: ' . $e->getMessage(), ['exception' => $e]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while sending the message',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function getCustomerByCustId(string $custId)
    {
        return Customers::query()
            ->leftJoin('platform_access_tokens', 'customers.platformRef', '=', 'platform_access_tokens.id')
            ->where('customers.custId', $custId)
            ->select('platform_access_tokens.fb_page_id', 'platform_access_tokens.accessToken')
            ->first();
    }

    private function storeChatHistory(string $custId, array $message, ?string $conversationRef = null): void
    {

        $contentType = 'text';
        switch ($message['contentType']) {
            case 'text': {
                    $contentType = 'text';
                    break;
                }
            case 'image': {
                    $contentType = 'image';
                    break;
                }
            case 'video': {
                    $contentType = 'video';
                    break;
                }
            case 'audio': {
                    $contentType = 'audio';
                    break;
                }
            case 'file': {
                    $contentType = 'file';
                    break;
                }
            default:
                $contentType = 'text';
        }
        $user = Auth::user();
        $senderUser = User::query()->where('empCode', $user->empCode)->first();

        ChatHistory::create([
            'custId' => $custId,
            'empCode' => 'BOT',
            'content' => $message['content'],
            'contentType' => $contentType,
            'sender' => $senderUser ? $senderUser->toJson() : null,
            'conversationRef' => $conversationRef,
        ]);
    }


    public function webhook(Request $request)
    {
        Log::info('>>> Facebook GET webhook verify called');
        $token_list = PlatformAccessTokens::all();
        return $token_list;
        $verify_token = $token_list->first()->fb_verify_token;
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        if ($mode === 'subscribe' && $token === $verify_token) {
            return response($challenge, 200);
        }

        return response('Forbidden', 403);
    }

    public function webhookFacebook(Request $request)
    {
        $data = $request->all();
        Log::info(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        $messaging = $data['entry'][0]['messaging'][0] ?? null;
        if (!$messaging) {
            Log::error("❌ ไม่พบ messaging ใน webhook payload");
            return response('Bad Request', 400);
        }


        // Ignore delivery, read, and echo messages
        if (
            isset($messaging['delivery']) ||
            isset($messaging['read']) ||
            ($messaging['message']['is_echo'] ?? false)
        ) {
            return response('EVENT_RECEIVED', 200);
        }

        $senderId = $messaging['sender']['id'];
        $recipientId = $messaging['recipient']['id'];
        $accessToken = PlatformAccessTokens::where('platform', 'facebook')->first()?->accessToken;
        $messageText = $messaging['message']['text'] ?? null;
        $textId = $messaging['message']['mid'] ?? null;
        $attachments = $messaging['message']['attachments'] ?? [];


        // 🔹 ดึงข้อมูลโปรไฟล์
        $senderProfile = $this->facebookService->getSenderProfile($senderId, $accessToken);
        $this->facebookService->storeCustomer($senderProfile);
        // Log::info(json_decode(json_encode($senderProfile), true));  
        // return;
        // 🔹 กรณีเป็นข้อความ (text)
        if ($messaging) {
            Log::warning('เข้ามาในนี้สร้างข้อความใหม่');
            // return;
            $this->facebookService->CheckRates(
                $recipientId,
                $senderId,
                $messageText,
                'text',
                $accessToken,
                $senderId,
                $textId
            );
            $this->facebookService->saveGetMassage(
                $recipientId,
                $senderId,
                $messageText,
                'text',
                $accessToken,
                $senderId,
                $textId
            );
            $this->pusherService->sendNotification($senderId);
        }
        if ($messageText) {
            // Log::info(json_encode($textId, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            // // return;
            // เรียก checkOrCreate ก่อน เพื่อสร้าง rate/conversation หากยังไม่มี
            $this->facebookService->checkOrCreateRateAndRespond(
                $recipientId,
                $senderId,
                $messageText,
                'text',
                $accessToken,
                $senderId,
                $textId
            );

            // แล้วค่อยบันทึกข้อความลง ChatHistory
            $this->facebookService->saveGetMassage(
                $recipientId,
                $senderId,
                $messageText,
                'text',
                $accessToken,
                $senderId,
                $textId
            );
        }


        // 🔹 กรณีเป็นภาพหรือสื่อแนบอื่น
        foreach ($attachments as $attachment) {
            $type = $attachment['type'];
            $url = $attachment['payload']['url'] ?? null;

            if ($type === 'image' && $url) {
                // บันทึกลงฐานข้อมูลหรือดาวน์โหลดภาพ
                $this->facebookService->saveGetMassage(
                    $recipientId,
                    $senderId,
                    $url,
                    'image',
                    $accessToken,
                    $senderId,
                    $textId
                );
            }

            if ($type === 'file' && $url) {
                // บันทึกลงฐานข้อมูลหรือดาวน์โหลดไฟล์
                $this->facebookService->saveGetMassage(
                    $recipientId,
                    $senderId,
                    $url,
                    'file',
                    $accessToken,
                    $senderId,
                    $textId
                );
            }
        }

        $this->pusherService->sendNotification($senderId);

        return response('EVENT_RECEIVED', 200);
    }
}
