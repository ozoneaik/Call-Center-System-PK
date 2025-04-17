<?php

namespace App\Http\Controllers\webhooks;

use App\Http\Controllers\Controller;
use App\Models\ActiveConversations;
use App\Models\BotMenu;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\Keyword;
use App\Models\PlatformAccessTokens;
use App\Models\Rates;
use App\Models\User;
use App\Services\MessageService;
use App\Services\webhooks\LineMessageService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LineController extends Controller
{
    protected LineMessageService $lineMessageService;
    protected MessageService $messageService;

    public function __construct(LineMessageService $LineMessageService, MessageService $messageService)
    {
        $this->lineMessageService = $LineMessageService;
        $this->messageService = $messageService;
    }

    public function webhook(Request $request): JsonResponse
    {

        try {
            DB::beginTransaction();
            $BOT = User::query()->where('empCode', 'BOT')->first();
            $events = $request['events'];
            $CUSTOMER = [];
            foreach ($events as $event) {
                Log::channel('line_webhook_log')->info($event);
                // เช็คก่อนว่า event มี type เป็น message หรือไม่
                if ($event['type'] === 'message') {


//------------------------------ เช็คต่อว่า เคยสร้าง ข้อมูลลูกค้ารายนี้หรือไม่ --------------------------------------------------------
                    $userId = $event['source']['userId'];
                    $customer = Customers::query()->where('custId', $userId)->first();
                    if (!$customer) {
                        $token_list = PlatformAccessTokens::all();
                        foreach ($token_list as $t) {
                            $response_customer = Http::withHeaders([
                                'Authorization' => 'Bearer ' . $t['accessToken'],
                            ])->get("https://api.line.me/v2/bot/profile/$userId");
                            if ($response_customer->status() == 200) {
                                $user = $response_customer->json();
                                $createCust = Customers::query()->create([
                                    'custId' => $user['userId'],
                                    'custName' => $user['displayName'],
                                    'description' => "ติดต่อมาจากไลน์ " . $t['description'],
                                    'avatar' => $user['pictureUrl'] ?? null,
                                    'platformRef' => $t['id']
                                ]);
                                $CUSTOMER = $createCust;
                                break;
                            }
                        }
                        if (!$CUSTOMER) throw new \Exception('ไม่พบลูกค้ารายนี้ในฐานข้อมูล และ ไม่พบ token ที่่เจอข้อมูลลูกค้ารายนี้');
                    } else $CUSTOMER = $customer;

                    $TOKEN = PlatformAccessTokens::query()->where('id', $CUSTOMER['platformRef'])->first();
//---------------------------------------------------------------------------------------------------------------------
//-----------------------เมื่อได้ customer แล้วให้เช็คต่อว่า ส่งข้อความอะไรเข้ามา แล้วเช็คว่าสถานะ rate ตอนนี้ เป็นอย่างไร-----------------------
                    $message = $event['message'];
                    $current_rate = Rates::query()
                        ->where('custId', $CUSTOMER['custId'])
                        ->orderBy('id', 'desc')
                        ->first();


                    if ($current_rate && $current_rate->status === 'success') {
                        $AcRef = ActiveConversations::query()
                            ->where('rateRef', $current_rate->id)
                            ->orderBy('id', 'desc')
                            ->first();
                        if ($message['type'] === 'sticker') {
                            $content = "https://stickershop.line-scdn.net/stickershop/v1/sticker/" . $message['stickerId'] . "/iPhone/sticker.png";
                            ChatHistory::query()->create([
                                'custId' => $CUSTOMER['custId'],
                                'content' => $content,
                                'contentType' => $message['type'],
                                'sender' => $CUSTOMER->toJson(),
                                'conversationRef' => $AcRef['id'],
                                'line_quoteToken' => $message['quoteToken']
                            ]);
                        } else {
                            if ($message['type'] === 'text') {
                                $keyword = Keyword::query()
                                    ->where('name', 'LIKE', '%' . $message['text'] . '%')
                                    ->first();
                                if ($keyword) {
                                    if ($keyword->event === true) {
                                        $acId = ActiveConversations::query()
                                            ->where('rateRef', $current_rate->id)
                                            ->orderBy('id', 'desc')
                                            ->first();
                                        ChatHistory::query()->create([
                                            'custId' => $CUSTOMER['custId'],
                                            'content' => $message['text'],
                                            'contentType' => $message['type'],
                                            'sender' => $CUSTOMER->toJson(),
                                            'conversationRef' => $acId['id'],
                                            'line_quoteToken' => $message['quoteToken']
                                        ]);
                                    } else {
                                        $newRate = Rates::query()->create([
                                            'custId' => $CUSTOMER['custId'],
                                            'rate' => 0,
                                            'status' => 'pending',
                                            'latestRoomId' => $keyword->redirectTo
                                        ]);
                                        $newAc = ActiveConversations::query()->create([
                                            'custId' => $CUSTOMER['custId'],
                                            'roomId' => $keyword->redirectTo,
                                            'rateRef' => $newRate->id
                                        ]);
                                        ChatHistory::query()->create([
                                            'custId' => $CUSTOMER['custId'],
                                            'content' => $message['text'],
                                            'contentType' => $message['type'],
                                            'sender' => $CUSTOMER->toJson(),
                                            'conversationRef' => $newAc['id'],
                                            'line_quoteToken' => $message['quoteToken']
                                        ]);
                                    }
                                } else {
                                    $newRate = Rates::query()->create([
                                        'custId' => $CUSTOMER['custId'],
                                        'rate' => 0,
                                        'latestRoomId' => $current_rate->latestRoomId,
                                        'status' => 'pending',
                                    ]);
                                    $newAc = ActiveConversations::query()->create([
                                        'custId' => $customer->custId,
                                        'roomId' => $current_rate->latestRoomId,
                                        'rateRef' => $newRate->id
                                    ]);
                                    $this->lineMessageService->storeMessage($CUSTOMER,$CUSTOMER, $message, $newAc->id, $TOKEN);

                                }
                            } else if ($message['type'] === 'image' || $message['type'] === 'audio' || $message['type'] === 'video' || $message['type'] === 'file' || $message['type'] === 'location') {
                                // เช็คก่อนว่า เกิน 12 ชัวโมงหรือไม่
                                $now = Carbon::now();
                                $current_rate->created_at = $now;
                                if ($now->diffInHours($current_rate->created_at) >= 12) {
                                    $newRate = Rates::query()->create([
                                        'custId' => $CUSTOMER['custId'],
                                        'rate' => 0,
                                        'status' => 'pending',
                                        'latestRoomId' => $current_rate->latestRoomId,
                                    ]);
                                    $newAc = ActiveConversations::query()->create([
                                        'custId' => $CUSTOMER['custId'],
                                        'roomId' => $newRate->latestRoomId,
                                        'rateRef' => $newRate->id
                                    ]);
                                    $this->lineMessageService->storeMessage($CUSTOMER,$CUSTOMER, $message, $newAc->id, $TOKEN);
                                } else {
                                    // สร้าง Rate ใหม่ พร้อมส่งเมนูบอท
                                    $newRate = Rates::query()->create([
                                        'custId' => $CUSTOMER['custId'],
                                        'rate' => 0,
                                        'latestRoomId' => 'ROOM00',
                                        'status' => 'progress',
                                    ]);
                                    $newAc = ActiveConversations::query()->create([
                                        'custId' => $CUSTOMER['custId'],
                                        'roomId' => 'ROOM00',
                                        'receiveAt' => $now,
                                        'startTime' => $now,
                                        'empCode' => $BOT->toJson(),
                                        'rateRef' => $newRate->id,
                                    ]);
                                    $this->lineMessageService->storeMessage($CUSTOMER,$CUSTOMER, $message, $newAc->id, $TOKEN);
                                    $message_menu['type'] = 'text';
                                    $message_menu['text'] = "สวัสดีคุณ " . $CUSTOMER['custName'] . " เพื่อให้การบริการของเราดำเนินไปอย่างรวดเร็วและสะดวกยิ่งขึ้น กรุณาเลือกหัวข้อด้านล่าง เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลและบริการท่านได้อย่างถูกต้องและรวดเร็ว ขอบคุณค่ะ/ครับ";
                                    $this->lineMessageService->storeMessage($CUSTOMER,$BOT, $message_menu, $newAc->id, $TOKEN);
                                    $this->lineMessageService->sendMenu($CUSTOMER, $TOKEN);
                                }
                            } else {
                                $now = Carbon::now();
                                $newRate = Rates::query()->create([
                                    'custId' => $CUSTOMER['custId'],
                                    'rate' => 0,
                                    'latestRoomId' => 'ROOM00',
                                    'status' => 'progress',
                                ]);
                                $newAc = ActiveConversations::query()->create([
                                    'custId' => $CUSTOMER['custId'],
                                    'roomId' => 'ROOM00',
                                    'receiveAt' => $now,
                                    'startTime' => $now,
                                    'empCode' => $BOT->toJson(),
                                    'rateRef' => $newRate->id,
                                ]);
                                $message_m['type'] = 'text';
                                $message_m['text'] = "ไม่สามารถระบุได้ว่าลูกค้าส่งอะไรเข้ามา";
                                $this->lineMessageService->storeMessage($CUSTOMER,$CUSTOMER, $message_m, $newAc->id, $TOKEN);
                                $message_menu['type'] = 'text';
                                $message_menu['text'] = "สวัสดีคุณ " . $CUSTOMER['custName'] . " เพื่อให้การบริการของเราดำเนินไปอย่างรวดเร็วและสะดวกยิ่งขึ้น กรุณาเลือกหัวข้อด้านล่าง เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลและบริการท่านได้อย่างถูกต้องและรวดเร็ว ขอบคุณค่ะ/ครับ";
                                $this->lineMessageService->storeMessage($CUSTOMER,$BOT, $message_menu, $newAc->id, $TOKEN);
                                $this->lineMessageService->sendMenu($CUSTOMER, $TOKEN);
                            }
                        } // สิ้นสุด rate status == success
                    }
                    else if ($current_rate && $current_rate->status === 'progress') {
                        $acRef = ActiveConversations::query()
                            ->where('custId', $CUSTOMER['custId'])
                            ->orderBy('id', 'desc')->first();
                        if ($current_rate->latestRoomId === 'ROOM00') {
                            if ($message['type'] === 'text') {
                                $menus = BotMenu::query()
                                    ->where('botTokenId', $CUSTOMER['platformRef'])
                                    ->get();
                                $findMenu = false;
                                foreach ($menus as $menu) {
                                    if ($menu->menuName === $message['text']) {
                                        $findMenu = true;
                                        $rateForUpdate = Rates::query()->where('id', $current_rate->id)->first();
                                        $rateForUpdate->latestRoomId = $menu->roomId;
                                        $rateForUpdate->update();
                                        $old_rate = Rates::query()
                                            ->where('custId', $CUSTOMER['custId'])
                                            ->orderBy('id', 'desc')->first();
                                        $old_rate->latestRoomId = $menu->roomId;
                                        $old_rate->status = 'pending';
                                        $old_rate->update();
                                        $old_ac = ActiveConversations::query()
                                            ->where('custId', $CUSTOMER['custId'])
                                            ->orderBy('id', 'desc')->first();
                                        $old_ac->endTime = Carbon::now();
                                        $old_ac->totalTime = $this->messageService->differentTime($old_ac->startTime, $old_ac->endTime);
                                        $old_ac->update();

                                        $new_ac = ActiveConversations::query()->create([
                                            'custId' => $CUSTOMER['custId'],
                                            'roomId' => $menu->roomId,
                                            'from_empCode' => $old_ac->empCode,
                                            'from_roomId' => $old_ac->roomId,
                                            'rateRef' => $old_rate->id,
                                        ]);

                                        $this->lineMessageService->storeMessage($CUSTOMER,$CUSTOMER, $message, $new_ac->id, $TOKEN);
                                        $message_send['text'] = 'ระบบกำลังส่งต่อให้เจ้าหน้าที่ที่รับผิดชอบเพื่อเร่งดำเนินการเข้ามาสนทนา กรุณารอสักครู่';
                                        $message_send['type'] = 'text';
                                        $body_send = ['to' => $CUSTOMER['custId'], 'messages' => [$message_send]];
                                        $this->lineMessageService->storeMessage($CUSTOMER,$BOT, $message_send, $new_ac->id, $TOKEN);
                                        $this->lineMessageService->pushMessage($body_send,$TOKEN);
                                        break;

                                    } else {
                                        $findMenu = false;
                                    }
                                }
                                if (!$findMenu) {
                                    $descriptions = PlatformAccessTokens::query()
                                        ->where('id', $CUSTOMER['platformRef'])
                                        ->first();
                                    if ($descriptions->descriptions === 'ศูนย์ซ่อม Pumpkin') {
                                        $roomId = 'ROOM02';
                                    } else if ($descriptions->descriptions === 'pumpkintools') {
                                        $roomId = 'ROOM06';
                                    } else {
                                        $roomId = 'ROOM01';
                                    }

                                    $old_rate = Rates::query()->where('custId', $CUSTOMER['custId'])
                                        ->orderBy('id', 'desc')->first();
                                    $old_rate->latestRoomId = $roomId;
                                    $old_rate->status = 'pending';
                                    $old_rate->update();
                                    $old_ac = ActiveConversations::query()
                                        ->where('custId', $CUSTOMER['custId'])
                                        ->orderBy('id', 'desc')->first();
                                    $old_ac->endTime = Carbon::now();
                                    $old_ac->totalTime = $this->messageService->differentTime($old_ac->startTime, $old_ac->endTime);
                                    $old_ac->update();
                                    $new_ac = ActiveConversations::query()->create([
                                        'custId' => $CUSTOMER['custId'],
                                        'roomId' => $roomId,
                                        'from_empCode' => $old_ac->empCode,
                                        'from_roomId' => $old_ac->roomId,
                                        'rateRef' => $old_rate->id,
                                    ]);
                                    $this->lineMessageService->storeMessage($CUSTOMER,$CUSTOMER, $message, $new_ac->id, $TOKEN);
                                    $message_send['text'] = 'ระบบกำลังส่งต่อให้เจ้าหน้าที่ที่รับผิดชอบเพื่อเร่งดำเนินการเข้ามาสนทนา กรุณารอสักครู่';
                                    $message_send['type'] = 'text';
                                    $this->lineMessageService->storeMessage($CUSTOMER,$BOT, $message_send, $new_ac->id, $TOKEN);
                                    $this->lineMessageService->pushMessage($message_send,$TOKEN);
                                }
                            } else {
                                $descriptions = PlatformAccessTokens::query()
                                    ->where('id', $CUSTOMER['platformRef'])
                                    ->first();
                                if ($descriptions->descriptions === 'ศูนย์ซ่อม Pumpkin') {
                                    $roomId = 'ROOM02';
                                } else if ($descriptions->descriptions === 'pumpkintools') {
                                    $roomId = 'ROOM06';
                                } else {
                                    $roomId = 'ROOM01';
                                }

                                $old_rate = Rates::query()->where('custId', $CUSTOMER['custId'])
                                    ->orderBy('id', 'desc')->first();
                                $old_rate->latestRoomId = $roomId;
                                $old_rate->status = 'pending';
                                $old_rate->update();
                                $old_ac = ActiveConversations::query()
                                    ->where('custId', $CUSTOMER['custId'])
                                    ->orderBy('id', 'desc')->first();
                                $old_ac->endTime = Carbon::now();
                                $old_ac->totalTime = $this->messageService->differentTime($old_ac->startTime, $old_ac->endTime);
                                $old_ac->update();
                                $new_ac = ActiveConversations::query()->create([
                                    'custId' => $CUSTOMER['custId'],
                                    'roomId' => $roomId,
                                    'from_empCode' => $old_ac->empCode,
                                    'from_roomId' => $old_ac->roomId,
                                    'rateRef' => $old_rate->id,
                                ]);
                                $this->lineMessageService->storeMessage($CUSTOMER,$CUSTOMER, $message, $new_ac->id, $TOKEN);
                                $message_send['text'] = 'ระบบกำลังส่งต่อให้เจ้าหน้าที่ที่รับผิดชอบเพื่อเร่งดำเนินการเข้ามาสนทนา กรุณารอสักครู่';
                                $message_send['type'] = 'text';
                                $this->lineMessageService->storeMessage($CUSTOMER,$BOT, $message_send, $new_ac->id, $TOKEN);
                                $this->lineMessageService->pushMessage($message_send,$TOKEN);
                            }
                        } else {
                            $this->lineMessageService->storeMessage($CUSTOMER,$CUSTOMER, $message, $acRef->id, $TOKEN);
                        }// สิ้นสุด rate status == progress
                    }
                    else if ($current_rate && $current_rate->status === 'pending') {
                        $queueChat = ActiveConversations::query()
                            ->leftJoin('rates', 'active_conversations.rateRef', '=', 'rates.id')
                            ->where('active_conversations.roomId', $current_rate['latestRoomId'])
                            ->where('rates.status', '=', 'pending') // เงื่อนไข where สำหรับ rates.status
                            ->orderBy('active_conversations.created_at', 'asc')
                            ->get();
                        $countProgress = Rates::query()
                            ->where('status', 'progress')
                            ->where('latestRoomId', $current_rate['latestRoomId'])
                            ->select('id')
                            ->count();
                        $count = $countProgress + 1;
                        foreach ($queueChat as $key => $value) {
                            if ($value->custId === $CUSTOMER['custId']) break;
                            else $count++;
                        }
                        $body = [
                            'to' => $CUSTOMER['custId'],
                            'messages' => [[
                                'type' => 'text',
                                'text' => 'คิวของท่านคือ ' . $count . ' คิว กรุณารอสักครู่'
                            ]]
                        ];
                        $message_count['type'] = 'text';
                        $message_count['text'] = 'คิวของท่านคือ ' . $count . ' คิว กรุณารอสักครู่';
                        $acId = ActiveConversations::query()
                            ->where('rateRef', $current_rate['id'])
                            ->orderBy('id', 'desc')->first();
                        $this->lineMessageService->storeMessage($CUSTOMER,$CUSTOMER, $message_count, $acId->id, $TOKEN);
                        $this->lineMessageService->pushMessage($body, $TOKEN);
                    }
                    else {
                        Log::channel('line_webhook_log')->info('ทำงานที่นี่');
                        if ($message['type'] === 'text') {
                            $keyword = Keyword::query()->where('name', 'like', "%$message[text]%")
                                ->first();
                            if ($keyword) {
                                if ($keyword->event !== true) {
                                    $newRate = Rates::query()->create([
                                        'custId' => $CUSTOMER['custId'],
                                        'latestRoomId' => $keyword->redirectTo,
                                        'status' => 'pending',
                                        'rate' => 0,
                                    ]);
                                    $newAc = ActiveConversations::query()->create([
                                        'custId' => $CUSTOMER['custId'],
                                        'roomId' => $keyword->redirectTo,
                                        'rateRef' => $newRate->id,
                                    ]);
                                    $this->lineMessageService->storeMessage($CUSTOMER,$CUSTOMER, $message, $newAc->id, $TOKEN);
                                }
                            } else {
                                Log::channel('line_webhook_log')->info('ไม่เจอ keyword');
                                $newRate = Rates::query()->create([
                                    'custId' => $CUSTOMER['custId'],
                                    'latestRoomId' => 'ROOM00',
                                    'status' => 'progress',
                                    'rate' => 0,
                                ]);
                                $newAc = ActiveConversations::query()->create([
                                    'custId' => $CUSTOMER['custId'],
                                    'roomId' => 'ROOM00',
                                    'rateRef' => $newRate->id,
                                    'receiveAt' => Carbon::now(),
                                    'startTime' => Carbon::now(),
                                ]);
                                $this->lineMessageService->storeMessage($CUSTOMER,$CUSTOMER, $message, $newAc->id, $TOKEN);
                                $message_menu['type'] = 'text';
                                $message_menu['text'] = "สวัสดีคุณ " . $CUSTOMER['custName'] . " เพื่อให้การบริการของเราดำเนินไปอย่างรวดเร็วและสะดวกยิ่งขึ้น กรุณาเลือกหัวข้อด้านล่าง เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลและบริการท่านได้อย่างถูกต้องและรวดเร็ว ขอบคุณค่ะ/ครับ";
                                $this->lineMessageService->storeMessage($CUSTOMER,$BOT, $message_menu, $newAc->id, $TOKEN);
                                $this->lineMessageService->sendMenu($CUSTOMER, $TOKEN);
                            }
                        } else {
                            $newRate = Rates::query()->create([
                                'custId' => $CUSTOMER['custId'],
                                'latestRoomId' => 'ROOM00',
                                'status' => 'pending',
                                'rate' => 0,
                            ]);
                            $newAc = ActiveConversations::query()->create([
                                'custId' => $CUSTOMER['custId'],
                                'roomId' => 'ROOM00',
                                'receiveAt' => Carbon::now(),
                                'startTime' => Carbon::now(),
                                'rateRef' => $newRate->id,
                            ]);
                            $this->lineMessageService->storeMessage($CUSTOMER,$CUSTOMER, $message, $newAc->id, $TOKEN);
                            $message_menu['type'] = 'text';
                            $message_menu['text'] = "สวัสดีคุณ " . $CUSTOMER['custName'] . " เพื่อให้การบริการของเราดำเนินไปอย่างรวดเร็วและสะดวกยิ่งขึ้น กรุณาเลือกหัวข้อด้านล่าง เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลและบริการท่านได้อย่างถูกต้องและรวดเร็ว ขอบคุณค่ะ/ครับ";
                            $this->lineMessageService->storeMessage($CUSTOMER,$BOT, $message_menu, $newAc->id, $TOKEN);
                            $this->lineMessageService->sendMenu($CUSTOMER, $TOKEN);
                        }
                    }

//---------------------------------------------------------------------------------------------------------------------
                } else throw new \Exception('type event ไม่ใช่ message');
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::channel('line_webhook_log')->error($e->getMessage() . 'บรรทัดที่ ' . $e->getLine());
            Log::channel('line_webhook_log')->error($e->getTraceAsString());
        }
        return response()->json([
            'message' => 'webhook received',
        ]);
    }
}
