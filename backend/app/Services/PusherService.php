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
            // 1. ดึงข้อมูลที่เกี่ยวข้องเหมือนเดิม
            $Rate = Rates::query()->where('custId', $custId)->orderBy('id', 'desc')->first();
            if (!$Rate) return; // ป้องกัน error ถ้าไม่เจอ Rate

            $activeConversation = ActiveConversations::query()->where('rateRef', $Rate->id)->orderBy('id', 'desc')->first();
            if (!$activeConversation) return; // ป้องกัน error ถ้าไม่เจอ ActiveConversation

            $from_roomId = ChatRooms::query()->where('roomId', $activeConversation->from_roomId)->select('roomName')->first();
            $activeConversation->roomName = $from_roomId->roomName ?? ' ';

            if ($title === 'มีการรับเรื่อง') {
                $activeConversation->empName = Auth::user()->name;
            }

            $customer = Customers::query()->where('custId', $custId)->first();

            // ดึงข้อความล่าสุดจาก 'conversation' ปัจจุบัน ไม่ใช่จากลูกค้าทั้งหมด
            $message = ChatHistory::query()->where('conversationRef', $activeConversation->id)->orderBy('id', 'desc')->first();
            if (!$message) return; // ป้องกัน error ถ้าไม่เจอ Message

            // --- ส่วนที่แก้ไขและเพิ่มเติม ---

            // 2. แปลงข้อมูลผู้ส่ง (sender) จาก JSON string เป็น Object
            $senderObject = json_decode($message->sender);
            $message->sender = $senderObject; // ใส่ object ที่แปลงแล้วกลับเข้าไป

            // 3. (สำคัญที่สุด) สร้างฟิลด์ sender_id ที่ Frontend ต้องการ
            //    เช็คว่าใน object ผู้ส่ง มี property 'custId' หรือไม่
            if (isset($senderObject->custId)) {
                // ถ้ามี แสดงว่าผู้ส่งคือ "ลูกค้า"
                $message->sender_id = $senderObject->custId;
            } else {
                // ถ้าไม่มี แสดงว่าผู้ส่งคือ "พนักงาน"
                $message->sender_id = null;
            }
            // --- สิ้นสุดส่วนที่แก้ไข ---

            // 4. เตรียมข้อมูลทั้งหมดเพื่อส่งไปที่ Pusher
            $Json['Rate'] = $Rate;
            $Json['activeConversation'] = $activeConversation;
            $Json['message'] = $message; // ตอนนี้ $message มี sender_id แล้ว
            $Json['customer'] = $customer;

            // 5. ส่ง Notification ผ่าน Pusher (เหมือนเดิม)
            $AppCluster = env('PUSHER_APP_CLUSTER');
            $AppKey = env('PUSHER_APP_KEY');
            $AppSecret = env('PUSHER_APP_SECRET');
            $AppID = env('PUSHER_APP_ID');
            $options = ['cluster' => $AppCluster, 'useTLS' => true];

            $pusher = new Pusher($AppKey, $AppSecret, $AppID, $options);
            $pusher->trigger('notifications', 'my-event', $Json);
        } catch (\Exception $e) {
            Log::error('PusherService->sendNotification Error: ' . $e->getMessage() . ' on line ' . $e->getLine());
        }
    }
}
