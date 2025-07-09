<?php

namespace App\Http\Controllers\Chats\Lazada;

use App\Http\Controllers\Controller;
use App\Http\Requests\sendToRequest;
use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\ChatRooms;
use App\Models\Rates;
use App\Models\TagMenu;
use App\Models\User;
use App\Services\PusherService;
use App\Services\webhooks\LazadaMessageService;
use App\Services\MessageService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LazadaReplyController extends Controller
{
    //
    protected MessageService $messageService;
    protected PusherService $pusherService;

    public function __construct(MessageService $messageService, PusherService $pusherService)
    {
        $this->messageService = $messageService;
        $this->pusherService = $pusherService;
    }

    public function reply(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $replyContent = $request['replyContent'];
            $replyContent['contentType'] = $replyContent['type'];
            $replyContent['content'] = $replyContent['text'];

            $chatHistory = new ChatHistory();
            $chatHistory['custId'] = $request['custId'];
            $chatHistory['contentType'] = $replyContent['type'];
            $chatHistory['content'] = $replyContent['text'];
            $chatHistory['sender'] = json_encode(Auth::user());
            $chatHistory['conversationRef'] = $request['activeId'];
            $chatHistory['line_quoted_message_id'] = $request['line_message_id'] ?? null;

            if (!$chatHistory->save()) {
                throw new \Exception('บันทึกข้อความลงฐานข้อมูลไม่สำเร็จ');
            }

            $sendMsgByLazada = LazadaMessageService::sendReply($request['custId'], $replyContent['content']);

            if (!$sendMsgByLazada['status']) {
                throw new \Exception($sendMsgByLazada['message']);
            }

            $chatHistory['line_message_id'] = $sendMsgByLazada['responseJson']['id'] ?? null;
            $chatHistory['line_quote_token'] = $sendMsgByLazada['responseJson']['quoteToken'] ?? null;
            $chatHistory->save();

            $this->pusherService->sendNotification($request['custId']);

            DB::commit();
            return response()->json([
                'message' => 'ส่งข้อความสำเร็จ',
                'response' => $chatHistory,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => $e->getMessage(),
                'request' => $request->all(),
            ], 400);
        }
    }
}
