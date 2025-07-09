<?php

namespace App\Http\Controllers;

use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\Models\User;
use App\Services\Facebook\FacebookService;
use App\Services\PusherService;
use GuzzleHttp\Promise\Create;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;

class MessageFacebookController extends Controller
{
    protected FacebookService $facebookService;
    protected PusherService $pusherService;

    public function __construct(FacebookService $facebookService, PusherService $pusherService)
    {
        $this->facebookService = $facebookService;
        $this->pusherService = $pusherService;
    }

    public function sendTextToFacebook(Request $request): JsonResponse
    {
        try {
            $acId = $request->input('conversationId');
            $custId = $request->input('custId');
            $messages = $request->input('messages');

            if (!$custId || empty($messages)) {
                return response()->json(['success' => false, 'message' => 'Missing required fields'], 422);
            }

            $customer = Customers::query()
                ->leftJoin('platform_access_tokens', 'customers.platformRef', '=', 'platform_access_tokens.id')
                ->where('customers.custId', $custId)
                // ->select('platform_access_tokens.fb_page_id', 'platform_access_tokens.accessToken')
                ->first();
            return response()->json($customer);
            if (!$customer) {
                return response()->json(['success' => false, 'message' => 'Customer not found'], 404);
            }
            Log::info(print_r($customer->toArray(), true));
            $senderId = $customer->fb_page_id;
            $accessToken = $customer->accessToken;
            $message = $messages[0];

            $this->facebookService->sendTextMessage($senderId, $custId, $message, $accessToken);

            $user = Auth::user();
            $senderUser = User::query()->where('empCode', $user->empCode)->first();

            ChatHistory::create([
                'custId' => $custId,
                'empCode' => 'BOT',
                'content' => $message['content'],
                'contentType' => 'text',
                'sender' => $senderUser ? $senderUser->toJson() : null,
                'conversationRef' => $acId,
            ]);

            $this->pusherService->sendNotification($custId);

            return response()->json(['success' => true, 'message' => 'Message sent successfully']);
        } catch (\Exception $e) {
            Log::error('Failed to send Facebook message: ' . $e->getMessage(), ['exception' => $e]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while sending the message',
                'error' => $e->getMessage()
            ], 500);
        }
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

        // ✅ กรอง event ที่ไม่ควรประมวลผล เช่น delivery, read, is_echo
        if (isset($messaging['delivery']) || isset($messaging['read']) || ($messaging['message']['is_echo'] ?? false)) {
            // Log::info("ℹ️ ข้าม event ประเภทระบบ เช่น delivery/read/echo");
            return response('EVENT_RECEIVED', 200);
        }

        $senderId = $messaging['sender']['id'];
        $recipientId = $messaging['recipient']['id'];
        $messageText = $messaging['message']['text'] ?? null;
        $messageType = isset($messaging['message']['attachments']) ? $messaging['message']['attachments'][0]['type'] : 'text';

        if (!$messageText) {
            Log::warning("⚠️ ข้อความไม่มีเนื้อหา text");
            return response('EVENT_RECEIVED', 200);
        }

        $accessToken = PlatformAccessTokens::where('platform', 'facebook')->first()?->accessToken;

        $senderProfile = $this->facebookService->getSenderProfile($senderId, $accessToken);
        Log::info($senderProfile);
        // return ;
        // $token_id = $this->facebookService->getTokenPlatformRef($recipientId);
        $this->facebookService->storeCustomer($senderProfile);

        $isNewRate = $this->facebookService->checkOrCreateRateAndRespond(
            $recipientId,
            $senderId,
            $messageText,
            $messageType,
            $accessToken,
            $senderId
        );

        if (!$isNewRate) {
            $this->facebookService->saveGetMassage($recipientId, $senderId, $messageText, $messageType, $accessToken, $senderId);
        }

        $this->pusherService->sendNotification($senderId);

        return response('EVENT_RECEIVED', 200);
    }
}
