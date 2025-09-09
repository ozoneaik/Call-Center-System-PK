<?php

namespace App\Http\Controllers\Chats\Line;

use App\Http\Controllers\Controller;
use App\Http\Controllers\webhooks\new\FacebookController;
use App\Http\Controllers\webhooks\new\LineWebhookController;
use App\Http\Controllers\webhooks\new\NewLazadaController;
use App\Http\Controllers\webhooks\new\NewShopeeController;
use App\Models\ActiveConversations;
use App\Models\BotMenu;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\Models\Rates;
use App\Services\MessageService;
use App\Services\PusherService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LineReceiveController extends Controller
{

    protected PusherService $pusherService;
    protected MessageService $messageService;
    public function __construct(PusherService $pusherService, MessageService $messageService)
    {
        $this->messageService = $messageService;
        $this->pusherService = $pusherService;
    }

    public function receive(Request $request)
    {
        $status = 400;
        $detail = 'ไม่พบข้อผิดพลาด';
        $rateId = $request['rateId'];
        $roomId = $request['roomId'];
        try {
            DB::beginTransaction();
            if (!$rateId) throw new \Exception('ไม่พบ AcId');
            $updateAC = ActiveConversations::query()->where('rateRef', $rateId)->orderBy('id', 'desc')->first();
            if (!$updateAC) throw new \Exception('ไม่พบ AC จาก rateRef ที่ receiveAt = null');
            $updateAC['receiveAt'] = Carbon::now();
            $updateAC['startTime'] = Carbon::now();
            $updateAC['empCode'] = Auth::user()->empCode;
            if ($updateAC->save()) {
                $updateRate = Rates::query()->where('id', $rateId)->first();
                if (!$updateRate) throw new \Exception('ไม่พบ Rate ที่ต้องการรับเรื่อง');
                $updateRate['status'] = 'progress';
                if ($updateRate->save()) {
                    // รับเรื่องสำเร็จ
                    $message = 'รับเรื่องสำเร็จ';
                    $status = 200;
                    //ส่งข้อความรับเรือง
                    $Rate = Rates::query()->where('id', $rateId)->first();

                    $now = Carbon::now();
                    $diff = $now->diffInHours($Rate->created_at, true);
                    if ($diff >= 12) {
                    }
                    $this->sendMessageReceive($Rate, $updateAC);
                    // $this->pusherService->sendNotification($updateAC['custId'], 'มีการรับเรื่อง');
                } else throw new \Exception('ไม่สามารถรับเรื่องได้เนื่องจากมีปัญหาการอัพเดท Rates');
            } else throw new \Exception('ไม่สามารถรับเรื่องได้เนื่องจากมีปัญหาการอัพเดท Active');
            DB::commit();
        } catch (\Exception $e) {
            $detail = $e->getMessage();
            $status = 400;
            DB::rollBack();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail' => $detail,
            ], $status ?? 400);
        }
    }

    private function sendMessageReceive($Rate, $AC)
    {

        $customer = Customers::query()->where('custId', $Rate->custId)->first();
        $token = PlatformAccessTokens::query()->where('id', $customer->platformRef)->first();
        $menus = BotMenu::query()->where('botTokenId', $token->id)->get();
        if (!$menus) throw new \Exception('ไม่พบเมนู');
        if (isset($AC->from_empCode) && $AC->from_empCode !== 'BOT') {
            $message['contentType'] = 'text';
            $message['content'] = "แอดมิน" . Auth::user()->name . "ขออนุญาติรับเรื่องดูแลคุณลูกค้าต่อจากเจ้าหน้าที่ท่านเดิม";
        } else {
            if ($token->description === 'pumpkintools') {
                if ($Rate->menu_select) {
                    $findMenu = BotMenu::query()->where('id', $Rate->menu_select)->first();
                    if ($findMenu->menuName === 'สอบถาม/แนะนำสินค้า' || $findMenu->menuName === 'สอบถาม/สั่งซื้อสินค้า') {
                        $message['contentType'] = 'text';
                        $message['content'] = "สวัสดีคุณลูกค้า " . Auth::user()->name . " ขออนุญาติดูแลคุณลูกค้า";
                        $message['content'] = $message['content'] . " คุณลูกค้าต้องการ " . $findMenu->menuName . " รบกวนแจ้งรายละเอียดเพิ่มเติมกับทางแอดมิน";
                        $message['content'] = $message['content'] . ' เช่น รหัสสินค้า / รุ่นสินค้า ที่ต้องการ เพื่อให้ทางแอดมินตรวจสอบให้กับทางลูกค้า';
                    } else if ($findMenu->menuName === 'ร้องเรียนบริการ') {
                        $message['contentType'] = 'text';
                        $message['content'] = "สวัสดีคุณลูกค้า " . Auth::user()->name . " ขออนุญาติดูแลคุณลูกค้า";
                        $message['content'] = $message['content'] . " รับเรื่องร้องเรียนคุณลูกค้า";
                    } else {
                        $findMenu = BotMenu::query()->where('id', $Rate->menu_select)->first();
                        $message['contentType'] = 'text';
                        $message['content'] = "สวัสดีคุณลูกค้า " . Auth::user()->name . " ขออนุญาติดูแลคุณลูกค้า";
                        $message['content'] = $message['content'] . " คุณลูกค้าต้องการ " . $findMenu->menuName . " รบกวนแจ้งรายละเอียดเพิ่มเติมกับทางแอดมินพร้อมให้บริการ";
                    }
                } else {
                    $message['contentType'] = 'text';
                    $message['content'] = "สวัสดีคุณลูกค้า " . Auth::user()->name . " ขออนุญาติดูแลคุณลูกค้า รบกวนแจ้งรายละเอียดเพิ่มเติมกับทางแอดมินพร้อมให้บริการ";
                }
            } elseif ($token->description === 'ศูนย์ซ่อม Pumpkin') {
                if ($Rate->menu_select) {
                    $findMenu = BotMenu::query()->where('id', $Rate->menu_select)->first();
                    foreach ($menus as $key => $menu) {
                        if ($findMenu->menuName === 'สอบถาม/ติดตามงานซ่อม') {
                            $message['contentType'] = 'text';
                            $message['content'] = "สวัสดีคุณลูกค้า " . Auth::user()->name . " ขออนุญาติดูแลคุณลูกค้า";
                            $message['content'] = $message['content'] . " คุณลูกค้าต้องการ " . $findMenu->menuName . " รบกวนแจ้งรายละเอียดเพิ่มเติมกับทางแอดมินพร้อมให้บริการ";
                            $message['content'] = $message['content'] . ' ชื่อ หรือ เบอร์โทรที่ส่งสินค้ามาซ่อม';
                        } elseif ($findMenu->menuName === 'สอบถาม/สั่งซื้ออะไหล่') {
                            $message['contentType'] = 'text';
                            $message['content'] = "สวัสดีคุณลูกค้า " . Auth::user()->name . " ขออนุญาติดูแลคุณลูกค้า";
                            $message['content'] = $message['content'] . " คุณลูกค้าต้องการ " . $findMenu->menuName . " รบกวนแจ้งรายละเอียดเพิ่มเติมกับทางแอดมินพร้อมให้บริการ";
                            $message['content'] =  $message['content'] . ' รหัสสินค้า / รุ่นสินค้า หรือ S/N สินค้า';
                        } elseif ($findMenu->menuName === 'สอบถาม/ที่อยู่ศูนย์บริการ') {
                            $message['contentType'] = 'text';
                            $message['content'] = "สวัสดีคุณลูกค้า " . Auth::user()->name . " ขออนุญาติดูแลคุณลูกค้า";
                            $message['content'] = $message['content'] . " คุณลูกค้าต้องการ " . $findMenu->menuName . " รบกวนแจ้งรายละเอียดเพิ่มเติมกับทางแอดมินพร้อมให้บริการ";
                            $message['content'] =  $message['content'] . ' จังหวัดที่คุณลูกค้าต้องการส่งสินค้าซ่อม';
                        } elseif ($findMenu->menuName === 'ร้องเรียนบริการ') {
                            $message['contentType'] = 'text';
                            $message['content'] = "สวัสดีคุณลูกค้า " . Auth::user()->name . " ขออนุญาติดูแลคุณลูกค้า";
                            $message['content'] = $message['content'] . " รับเรื่องร้องเรียนคุณลูกค้า";
                        } else {
                            $message['contentType'] = 'text';
                            $message['content'] = "สวัสดีคุณลูกค้า " . Auth::user()->name . " ขออนุญาติดูแลคุณลูกค้า รบกวนแจ้งรายละเอียดเพิ่มเติมกับทางแอดมินพร้อมให้บริการ";
                        }
                    }
                } else {
                    $message['contentType'] = 'text';
                    $message['content'] = "สวัสดีคุณลูกค้า " . Auth::user()->name . " ขออนุญาติดูแลคุณลูกค้า รบกวนแจ้งรายละเอียดเพิ่มเติมกับทางแอดมินพร้อมให้บริการ";
                }
            } else {
                $message['contentType'] = 'text';
                $message['content'] = "สวัสดีคุณลูกค้า " . Auth::user()->name . " ขออนุญาติดูแลคุณลูกค้า";
            }
        }


        // ส่งข้อความไปยังลูกค้า
        $send_message_data = [
            'status' => true,
            'case' => [
                'status' => true,
                'send_to_cust' => true,
                'type_send' => 'present',
                'type_message' => 'push',
                'messages' => [
                    [
                        'content' => $message['content'],
                        'contentType' => $message['contentType']
                    ]
                ],
                'customer' => $customer,
                'ac_id' => $AC->id,
                'platform_access_token' => $token,
                'reply_token' => null,
                'employee' => Auth::user()
            ]

        ];
        switch ($token['platform']) {
            case 'line':
                $send_message = LineWebhookController::ReplyPushMessage($send_message_data);
                break;
            case 'facebook':
                $send_message = FacebookController::reply_push_message($send_message_data);
                break;
            default:
                $pusherService = new PusherService();
                $pusherService->sendNotification($customer['custId'], 'มีการรับเรื่อง');
                break;
        }
        if ($send_message['status']) {
        } else {
            throw new \Exception($send_message['message'] ?? 'ไม่สามารถส่งข้อความได้กรุณาลองใหม่อีกครั้ง หรือ ติดต่อ admin it');
        }
    }
}
