<?php

namespace App\Http\Controllers\line;

use App\Events\MessageNotification;
use App\Http\Controllers\Controller;
use App\Models\chatHistory;
use App\Models\customers;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Pusher\Pusher;


class LineController extends Controller
{
    public function webhook(Request $request): JsonResponse
    {
        $res = $request->all();
        $events = $res["events"];
        Log::info('Showing request', ['request' => $request]);
        // ตรวจสอบก่อนว่า มี message ส่งมามั้ย
        if (count($events) > 0) {
            //ตรวจสอบว่ามี userId หรือไม่
            if ($events[0]['source']['userId']){
                $userId = $events[0]['source']['userId'];
                $URL = "https://api.line.me/v2/bot/profile/".$userId;
                try {
                    $response = Http::withHeaders([
                        'Authorization' => 'Bearer ' . env('CHANNEL_ACCESS_TOKEN')
                    ])->get($URL);

                    // ตรวจสอบสถานะการตอบสนอง
                    if ($response->successful()) {
                        $profile = $response->json(); // แปลง response เป็น array หรือ object
                        Log::info('PROFILE', ['request' => json_encode($profile, JSON_PRETTY_PRINT)]);
                        // เช็คว่าเคยบันทึก customer คนนี้หรือยัง
                        $checkCustomer = customers::where('custId',$userId)->where('platform','line')->first();
                        if (!$checkCustomer){
                            $customer = new customers();
                            $customer->custId = $userId;
                            $customer->name = $profile['displayName'];
                            $customer->imageUrl = $profile['pictureUrl'];
                            $customer->platform = 'line';
                            $customer->description = $profile['statusMessage'];
                            $customer->groupId = 1;
                            $customer->save();
                        }
                        $chatHistory = new chatHistory();
                        $chatHistory->custId = $events[0]['source']['userId'];
                        $chatHistory->textMessage = $events[0]['message']['text'];
                        $chatHistory->save();
                        //ส่ง event ไปยัง web socket
                        $options = [
                            'cluster' => env('PUSHER_APP_CLUSTER'),
                            'useTLS' => true
                        ];
                        $pusher = new Pusher(env('PUSHER_APP_KEY'), env('PUSHER_APP_SECRET'), env('PUSHER_APP_ID'), $options);
                        $chatId = 'chat.'.$userId;
                        $pusher->trigger($chatId, 'my-event', [
                            'message' => $events[0]['message']['text']
                        ]);
                    } else {
                        // จัดการกับกรณีที่การร้องขอไม่สำเร็จ
                        $error = $response->body(); // รับข้อความ error
                    }
                } catch (ConnectionException $e) {
                    Log::info('Showing request', ['request' => json_encode($res, JSON_PRETTY_PRINT)]);
                } catch (\Exception $e){
                    return response()->json(['error' => $e->getMessage()], 500);
                }
            }
        }
//        Log::info('Showing request', ['request' => json_encode($request, JSON_PRETTY_PRINT)]);
        return response()->json([
            'response' => $request->all()
        ]);
    }
}
