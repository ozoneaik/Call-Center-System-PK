<?php

namespace App\Services;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\ChatRooms;
use App\Models\Customers;
use App\Models\Rates;
use App\Models\User;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Pusher\Pusher;
use Pusher\PusherException;

class PusherService
{
    protected ResponseService $response;

    public function newMessage($message, $emp = false, $title): array
    {
        try {
            $AppCluster = env('PUSHER_APP_CLUSTER');
            $AppKey = env('PUSHER_APP_KEY');
            $AppSecret = env('PUSHER_APP_SECRET');
            $AppID = env('PUSHER_APP_ID');

            if (!empty($message)) {
                $customer = Customers::query()->where('custId', $message['custId'])->first();
                $message['custName'] = $customer['custName'];
                $message['avatar'] = $customer['avatar'];
                $message['empSend'] = $emp;
                $message['title'] = $title;
            } else {
                $message['title'] = $title;
                $message['empSend'] = $emp;
            }
            $options = ['cluster' => $AppCluster, 'useTLS' => true];
            $pusher = new Pusher($AppKey, $AppSecret, $AppID, $options);
            $pusher->trigger('notifications', 'my-event', $message);
            $data['status'] = true;
            $data['message'] = 'การแจ้งเตือนสำเร็จ';
            $data['detail'] = 'ไม่พบข้อผิดพลาด';
        } catch (\Exception | GuzzleException $e) {
            $data['status'] = false;
            $data['message'] = 'การแจ้งเตือนผิดพลาด';
            $data['detail'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function sendNotification($custId, $title = ''): void
    {
        try {
            $Rate = Rates::query()->where('custId', $custId)->orderBy('id', 'desc')->first();
            if (!$Rate) return;

            $activeConversation = ActiveConversations::query()->where('rateRef', $Rate->id)->orderBy('id', 'desc')->first();
            if (!$activeConversation) return;

            $from_roomId = ChatRooms::query()->where('roomId', $activeConversation->from_roomId)->select('roomName')->first();
            $activeConversation->roomName = $from_roomId->roomName ?? ' ';

            if ($title === 'มีการรับเรื่อง') {
                $activeConversation->empName = Auth::user()->name;
            }

            $customer = Customers::query()->where('custId', $custId)->first();

            $message = ChatHistory::query()->where('conversationRef', $activeConversation->id)->orderBy('id', 'desc')->first();
            if (!$message) return;


            $senderObject = json_decode($message->sender);
            $message->sender = $senderObject;

            if (isset($senderObject->custId)) {
                $message->sender_id = $senderObject->custId;
            } else {
                $message->sender_id = null;
            }

            $Json['Rate'] = $Rate;
            $Json['activeConversation'] = $activeConversation;
            $Json['message'] = $message;
            $Json['customer'] = $customer;

            $AppCluster = env('PUSHER_APP_CLUSTER');
            $AppKey = env('PUSHER_APP_KEY');
            $AppSecret = env('PUSHER_APP_SECRET');
            $AppID = env('PUSHER_APP_ID');
            $options = ['cluster' => $AppCluster, 'useTLS' => true];

            $pusher = new Pusher($AppKey, $AppSecret, $AppID,$options);
            $pusher->trigger('notifications', 'my-event', $Json);
        } catch (\Exception $e) {
            Log::error('PusherService->sendNotification Error: ' . $e->getMessage() . ' on line ' . $e->getLine());
        }
    }
}
