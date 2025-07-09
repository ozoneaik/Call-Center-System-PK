<?php

namespace App\Http\Controllers\Chats\Lazada;

use App\Http\Controllers\Controller;
use App\Http\Requests\sendToRequest;
use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\ChatRooms;
use App\Models\Customers;
use App\Models\Rates;
use App\Models\User;
use App\Services\PusherService;
use App\Services\webhooks\LazadaMessageService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LazadaSendToController extends Controller
{
    protected PusherService $pusherService;

    public function __construct(PusherService $pusherService)
    {
        $this->pusherService = $pusherService;
    }

    public function sendTo(sendToRequest $request): JsonResponse
    {
        $status = 400;
        $message = 'เกิดข้อผิดพลาด';
        $detail = 'ไม่พบข้อผิดพลาด';

        try {
            DB::beginTransaction();

            $rate = Rates::query()->where('id', $request['rateId'])->first();
            if (!$rate) throw new \Exception('ไม่พบ Rate ที่ต้องการอัพเดท');

            $fromRoomId = $rate['latestRoomId'];
            $rate['latestRoomId'] = $request['latestRoomId'];
            $rate['status'] = 'pending';
            if (!$rate->save()) throw new \Exception('ไม่สามารถอัปเดต Rate ได้');

            $active = ActiveConversations::query()->where('id', $request['activeConversationId'])->first();
            if (!$active) throw new \Exception('ไม่พบ ActiveConversation');

            $room = ChatRooms::query()->where('roomId', $active['roomId'])->first();

            if (!empty($active['startTime'])) {
                $active['endTime'] = Carbon::now();
                $active['totalTime'] = $this->calculateTotalTime($active['startTime'], $active['endTime']);
            } else {
                $active['startTime'] = Carbon::now();
                $active['endTime'] = $active['startTime'];
                $active['totalTime'] = '0 วัน 0 ชั่วโมง 0 นาที';
            }
            if (!$active->save()) throw new \Exception('ไม่สามารถอัปเดต ActiveConversation ได้');

            $newAc = new ActiveConversations();
            $newAc['custId'] = $rate['custId'];
            $newAc['roomId'] = $request['latestRoomId'];
            $newAc['from_empCode'] = $active['empCode'];
            $newAc['from_roomId'] = $fromRoomId;
            $newAc['rateRef'] = $rate['id'];

            $bot = User::query()->where('empCode', 'BOT')->first();
            $chatHistory = new ChatHistory();
            $chatHistory['custId'] = $newAc['custId'];
            $chatHistory['content'] = 'มีการส่งต่อมาจาก ' . $room['roomName'] . ' โดย 👤' . auth()->user()->name;
            $chatHistory['contentType'] = 'text';
            $chatHistory['sender'] = json_encode($bot);
            $chatHistory['conversationRef'] = $active['id'];
            $chatHistory->save();

            if (!$newAc->save()) throw new \Exception('ไม่สามารถบันทึก ActiveConversation ใหม่');

            $message = 'ส่งต่อสำเร็จ';
            $status = 200;
            $detail = 'ไม่พบข้อผิดพลาด';

            $this->pusherService->sendNotification($rate['custId']);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            $detail = $e->getMessage();
        }

        return response()->json([
            'message' => $message,
            'detail' => $detail,
        ], $status);
    }

    private function calculateTotalTime($start, $end): string
    {
        $diff = $end->diff($start);
        return $diff->d . ' วัน ' . $diff->h . ' ชั่วโมง ' . $diff->i . ' นาที';
    }
}