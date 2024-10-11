<?php

namespace App\Services;

use App\Models\Customers;
use GuzzleHttp\Exception\GuzzleException;
use Pusher\Pusher;

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
                $customer = Customers::where('custId', $message['custId'])->first();
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
        } catch (\Exception|GuzzleException $e) {
            $data['status'] = false;
            $data['message'] = 'การแจ้งเตือนผิดพลาด';
            $data['detail'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function newChatRooms($chatRooms): array
    {
        try {
            $AppCluster = env('PUSHER_APP_CLUSTER');
            $AppKey = env('PUSHER_APP_KEY');
            $AppSecret = env('PUSHER_APP_SECRET');
            $AppID = env('PUSHER_APP_ID');

            $options = ['cluster' => $AppCluster, 'useTLS' => true];
            $pusher = new Pusher($AppKey, $AppSecret, $AppID, $options);
            $pusher->trigger('newChatRooms', 'my-event', $chatRooms);
            $data['status'] = true;
            $data['message'] = 'อัพเดทรายการห้อง';
            $data['detail'] = 'ไม่พบข้อผิดพลาด';
        } catch (\Exception|GuzzleException $e) {
            $data['status'] = false;
            $data['message'] = 'การแจ้งเตือนผิดพลาด';
            $data['detail'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

}
