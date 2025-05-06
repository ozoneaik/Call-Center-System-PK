<?php

namespace App\Http\Controllers\Chats\Line;

use App\Http\Controllers\Controller;
use App\Models\ActiveConversations;
use App\Models\BotMenu;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\Models\Rates;
use App\Services\MessageService;
use App\Services\PusherService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

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
            $updateAC['empCode'] = auth()->user()->empCode;
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
                    $this->sendMessageReceive($Rate, $updateAC);
                    $this->pusherService->sendNotification($updateAC['custId'], 'มีการรับเรื่อง');
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
        if ($token->description === 'pumpkintools') {
            if ($Rate->menu_select) {
                $findMenu = BotMenu::query()->where('id', $Rate->menu_select)->first();
                if ($findMenu->menuName === 'สอบถาม/แนะนำสินค้า' || $findMenu->menuName === 'สอบถาม/สั่งซื้อสินค้า') {
                    $message['contentType'] = 'text';
                    $message['content'] = "สวัสดีคุณลูกค้า " . Auth::user()->name . " ขออนุญาติดูแลคุณลูกค้า";
                    $message['content'] = $message['content'] . " คุณลูกค้าต้องการ " . $findMenu->menuName . " รบกวนแจ้งรายละเอียดเพิ่มเติมกับทางแอดมิน";
                    $message['content'] += ' เช่น รหัสสินค้า / รุ่นสินค้า ที่ต้องการ เพื่อให้ทางแอดมินตรวจสอบให้กับทางลูกค้า';
                } else if ($findMenu->menuName === 'ร้องเรียนบริการ') {
                    $message['contentType'] = 'text';
                    $message['content'] = "สวัสดีคุณลูกค้า " . Auth::user()->name . " ขออนุญาติดูแลคุณลูกค้า";
                    $message['content'] = $message['content'] . " คุณลูกค้าต้องการ " . $findMenu->menuName . " คุณลูกค้าต้องการร้องเรียนบริการด้านใด  รบกวนแจ้งรายละเอียดเพิ่มเติมกับทางแอดมินพร้อมรับเรื่อง";
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
                        $message['content'] = $message['content'] . " คุณลูกค้าต้องการ " . $findMenu->menuName . " คุณลูกค้าต้องการร้องเรียนบริการด้านใด  รบกวนแจ้งรายละเอียดเพิ่มเติมกับทางแอดมินพร้อมรับเรื่อง";
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
            $message['content'] = "สวัสดีคุณลูกค้า " . Auth::user()->name . " ขออนุญาติดูแลคุณลูกค้า รบกวนแจ้งรายละเอียดเพิ่มเติมกับทางแอดมินพร้อมให้บริการ";
        }
        $newChatHistory = new ChatHistory();
        $newChatHistory->custId = $Rate->custId;
        $newChatHistory->content = $message['content'];
        $newChatHistory->contentType = $message['contentType'];
        $newChatHistory->sender = json_encode(auth()->user());
        $newChatHistory->conversationRef = $AC->id;
        $newChatHistory->save();
        $sendMsgByLine = $this->messageService->sendMsgByLine($Rate->custId, $message);
        if ($sendMsgByLine['status']) {
            $newChatHistory->line_message_id = $sendMsgByLine['responseJson']['id'];
            $newChatHistory->line_quote_token = $sendMsgByLine['responseJson']['quoteToken'];
            $newChatHistory->save();
        } else {
            throw new \Exception($sendMsgByLine['message'] ?? 'ไม่สามารถส่งข้อความได้เนื่องจากมีปัญหาการส่งข้อความ line api');
        }
    }
}
