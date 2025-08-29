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
use App\Models\SaleInformation;
use App\Models\User;
use App\Services\MessageService;
use App\Services\PusherService;
use App\Services\webhooks\LineMessageService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LineUATController extends Controller
{
    protected LineMessageService $lineMessageService;
    protected MessageService $messageService;
    protected PusherService $pusherService;

    public function __construct(
        LineMessageService $LineMessageService,
        MessageService     $messageService,
        PusherService      $pusherService,
    ) {
        $this->lineMessageService = $LineMessageService;
        $this->messageService = $messageService;
        $this->pusherService = $pusherService;
    }

    public function webhook(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            $BOT = User::query()->where('empCode', 'BOT')->first();
            $events = $request['events'];

            foreach ($events as $event) {
                Log::channel('line_webhook_log')->info($event);
                // ถ้าส่งข้อความธรรมดามา
                if ($event['type'] === 'message') {
                    $userId = $event['source']['userId'];
                    $CUSTOMER = $this->getOrCreateCustomer($userId);
                    $TOKEN = PlatformAccessTokens::query()->where('id', $CUSTOMER['platformRef'])->first();
                    $message = $event['message'];

                    $this->handleMessage($CUSTOMER, $message, $BOT, $TOKEN);
                }
                // ถ้าเป็นการกด like , unlike
                elseif ($event['type'] === 'postback') $this->handlePostback($event);
                // ลูกค้า ทำอย่างอื่นที่ไม่ใช่ข้อความ
                else throw new \Exception('type event ไม่ใช่ message');
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::channel('line_webhook_log')->error($e->getMessage() . 'บรรทัดที่ ' . $e->getLine() . $e->getFile());
        }

        return response()->json(['message' => 'webhook received']);
    }

    private function getOrCreateCustomer($userId)
    {
        $customer = Customers::query()->where('custId', $userId)->first();

        if (!$customer) {
            $token_list = PlatformAccessTokens::all();
            foreach ($token_list as $t) {
                $response_customer = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $t['accessToken'],
                ])->get("https://api.line.me/v2/bot/profile/$userId");

                if ($response_customer->status() == 200) {
                    $user = $response_customer->json();
                    return Customers::query()->create([
                        'custId' => $user['userId'],
                        'custName' => $user['displayName'],
                        'description' => "ติดต่อมาจากไลน์ " . $t['description'],
                        'avatar' => $user['pictureUrl'] ?? null,
                        'platformRef' => $t['id']
                    ]);
                }
            }

            throw new \Exception('ไม่พบลูกค้ารายนี้ในฐานข้อมูล และ ไม่พบ token ที่่เจอข้อมูลลูกค้ารายนี้');
        }

        return $customer;
    }

    private function handleMessage($CUSTOMER, $message, $BOT, $TOKEN): void
    {
        $customer_is_sale = $this->filterCaseSale($CUSTOMER['custId']);
        $current_rate = Rates::query()->where('custId', $CUSTOMER['custId'])->orderBy('id', 'desc')->first();
        if ($customer_is_sale) {
            $this->createSaleChat($CUSTOMER, $current_rate, $message);
            return;
        }
        if ($current_rate && $current_rate->status === 'success') {
            $this->handleSuccessRateMessage($CUSTOMER, $message, $current_rate, $BOT, $TOKEN);
        } elseif ($current_rate && $current_rate->status === 'progress') {
            $this->handleProgressRateMessage($CUSTOMER, $message, $current_rate, $BOT, $TOKEN);
        } elseif ($current_rate && $current_rate->status === 'pending') {
            $this->handlePendingRateMessage($CUSTOMER, $message, $current_rate, $BOT, $TOKEN);
        } else $this->handleNewMessage($CUSTOMER, $message, $BOT, $TOKEN);
    }

    private function handleSuccessRateMessage($CUSTOMER, $message, $current_rate, $BOT, $TOKEN): void
    {
        $AcRef = ActiveConversations::query()->where('rateRef', $current_rate->id)->orderBy('id', 'desc')->first();

        if ($message['type'] === 'sticker') {
            $content = "https://stickershop.line-scdn.net/stickershop/v1/sticker/" . $message['stickerId'] . "/iPhone/sticker.png";
            ChatHistory::query()->create([
                'custId' => $CUSTOMER['custId'],
                'content' => $content,
                'contentType' => $message['type'],
                'sender' => $CUSTOMER->toJson(),
                'conversationRef' => $AcRef['id'],
                'line_quoteToken' => $message['quoteToken'] ?? null
            ]);
            return;
        }

        // Simplified message handling based on type
        if ($message['type'] === 'text') {
            $this->handleTextMessage($CUSTOMER, $message, $current_rate, $BOT, $TOKEN, $AcRef);
        } else {
            $this->handleMediaMessage($CUSTOMER, $message, $current_rate, $BOT, $TOKEN);
        }
    }

    private function handleTextMessage($CUSTOMER, $message, $current_rate, $BOT, $TOKEN, $AcRef = null): void
    {
        $keyword = Keyword::query()
            ->where('name', 'LIKE', '%' . $message['text'] . '%')
            ->first();

        if ($keyword) {
            if ($keyword->event === true) {
                if (!$AcRef) {
                    $AcRef = ActiveConversations::query()
                        ->where('rateRef', $current_rate->id)
                        ->orderBy('id', 'desc')
                        ->first();
                }

                ChatHistory::query()->create([
                    'custId' => $CUSTOMER['custId'],
                    'content' => $message['text'],
                    'contentType' => $message['type'],
                    'sender' => $CUSTOMER->toJson(),
                    'conversationRef' => $AcRef['id'],
                    'line_quoteToken' => $message['quoteToken'] ?? null
                ]);
            } else {
                $this->createNewConversation($CUSTOMER, $message, $keyword->redirectTo, 'pending', $BOT, $TOKEN);
                $this->pusherService->sendNotification($CUSTOMER['custId']);
            }
        } else {
            $now = Carbon::now();
            $created_at = Carbon::parse($current_rate->created_at);
            Log::info('created_at: ' . $created_at);
            Log::info('instance of: ' . $current_rate->created_at instanceof \Carbon\Carbon);
            Log::info('$current_rate->created_at: ' . $current_rate->created_at);
            Log::info('now: ' . $now);
            Log::info('diffInHours: ' . $now->diffInHours($current_rate->created_at));
            Log::info('lessThanOrEqualTo: ' . $current_rate->created_at->lessThanOrEqualTo($now));
            $diff = $now->diffInHours($current_rate->created_at, true);
            Log::info('diffInHours New: ' . $diff);
            if ($current_rate && ($diff <= 12)) { // ทักมาภายใน 12 ชั่วโมง
                $this->createNewConversation($CUSTOMER, $message, $current_rate->latestRoomId, 'pending', $BOT, $TOKEN);
            } else { // ทักมามากกว่า 12 ชั่วโมง
                $this->createBotConversation($CUSTOMER, $message, $BOT, $TOKEN);
            }
        }
    }

    private function handleMediaMessage($CUSTOMER, $message, $current_rate, $BOT, $TOKEN): void
    {
        $now = Carbon::now();
        if ($current_rate && $now->diffInHours($current_rate->created_at, true) <= 12) { // ทักมาภายใน 12 ชั่วโมง
            $this->createNewConversation($CUSTOMER, $message, $current_rate->latestRoomId, 'pending', $BOT, $TOKEN);
        } else { // ทักมามากกว่า 12 ชั่วโมง
            $this->createBotConversation($CUSTOMER, $message, $BOT, $TOKEN);
        }
    }

    private function createNewConversation($CUSTOMER, $message, $roomId, $status, $BOT, $TOKEN)
    {
        $newRate = Rates::query()->create([
            'custId' => $CUSTOMER['custId'],
            'rate' => 0,
            'latestRoomId' => $roomId,
            'status' => $status,
        ]);

        $newAc = ActiveConversations::query()->create([
            'custId' => $CUSTOMER['custId'],
            'roomId' => $roomId,
            'rateRef' => $newRate->id
        ]);

        $this->lineMessageService->storeMessage($CUSTOMER, $CUSTOMER, $message, $newAc->id, $TOKEN);
        $this->pusherService->sendNotification($CUSTOMER['custId']);

        if ($roomId !== 'ROOM00') {
            $message_send = [
                'text' => 'ระบบกำลังส่งต่อให้เจ้าหน้าที่ที่รับผิดชอบเพื่อเร่งดำเนินการเข้ามาสนทนา กรุณารอสักครู่',
                'type' => 'text'
            ];
            $this->lineMessageService->storeMessage($CUSTOMER, $BOT, $message_send, $newAc->id, $TOKEN);

            $body_send = ['to' => $CUSTOMER['custId'], 'messages' => [$message_send]];
            $this->lineMessageService->pushMessage($body_send, $TOKEN);
            $this->pusherService->sendNotification($CUSTOMER['custId']);
        }

        return $newAc;
    }

    private function createBotConversation($CUSTOMER, $message, $BOT, $TOKEN)
    {
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
            'empCode' => 'BOT',
            'rateRef' => $newRate->id,
        ]);

        $this->lineMessageService->storeMessage($CUSTOMER, $CUSTOMER, $message, $newAc->id, $TOKEN);
        $this->pusherService->sendNotification($CUSTOMER['custId']);

        $message_menu = [
            'type' => 'text',
            // 'text' => "สวัสดีคุณ " . $CUSTOMER['custName'] . " เพื่อให้การบริการของเราดำเนินไปอย่างรวดเร็วและสะดวกยิ่งขึ้น กรุณาเลือกหัวข้อด้านล่าง เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลและบริการท่านได้อย่างถูกต้องและรวดเร็ว ขอบคุณค่ะ/ครับ",
            'text' => "เนื่องจาก ในวันที่ 30/08/2568 - 01/09/2568 ทางบริษัทมีการจัดสัมนาประจำปี จึงทำให้การให้ข้อมูลคุณลูกค้าอาจจะล่าช้ากว่าปกติ จึงขออภัยมา ณ ที่นี่ด้วย เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลท่านได้ถูกต้อง กรุณาเลือก เมนู ที่ท่านต้องการติดต่อ"
        ];

        $this->lineMessageService->storeMessage($CUSTOMER, $BOT, $message_menu, $newAc->id, $TOKEN);
        $this->lineMessageService->sendMenu($CUSTOMER, $TOKEN);
        $this->pusherService->sendNotification($CUSTOMER['custId']);

        return $newAc;
    }

    private function handleProgressRateMessage($CUSTOMER, $message, $current_rate, $BOT, $TOKEN): void
    {
        $acRef = ActiveConversations::query()->where('custId', $CUSTOMER['custId'])->orderBy('id', 'desc')->first();

        if ($current_rate->latestRoomId === 'ROOM00') {
            if ($message['type'] === 'text') {
                // ส่งเมนูบอทไป
                $this->handleBotMenuSelection($CUSTOMER, $message, $current_rate, $acRef, $BOT, $TOKEN);
            } else {
                // ส่งไปยังห้องอื่นๆ
                $this->forwardToServiceRoom($CUSTOMER, $message, $current_rate, $acRef, $BOT, $TOKEN);
            }
        } else {
            $this->lineMessageService->storeMessage($CUSTOMER, $CUSTOMER, $message, $acRef->id, $TOKEN);
        }
        $this->pusherService->sendNotification($CUSTOMER['custId']);
    }

    private function handleBotMenuSelection($CUSTOMER, $message, $current_rate, $acRef, $BOT, $TOKEN): void
    {
        $menus = BotMenu::query()->where('botTokenId', $CUSTOMER['platformRef'])->get();

        $findMenu = false;
        foreach ($menus as $menu) {
            if ($menu->menuName === $message['text']) { // เมนูตรงกับข้อความ
                $current_rate->menu_select = $menu->id;
                $current_rate->save();
                $this->updateRateAndForwardToRoom($CUSTOMER, $message, $current_rate, $acRef, $menu->roomId, $BOT, $TOKEN);
                $findMenu = true;
                break;
            }
        }

        if (!$findMenu) {
            $this->forwardToDefaultRoom($CUSTOMER, $message, $current_rate, $acRef, $BOT, $TOKEN);
        }
    }

    private function updateRateAndForwardToRoom($CUSTOMER, $message, $current_rate, $acRef, $roomId, $BOT, $TOKEN): void
    {
        // Update rate
        $current_rate->latestRoomId = $roomId;
        $current_rate->status = 'pending';
        $current_rate->update();

        // End current conversation
        $acRef->endTime = Carbon::now();
        $acRef->totalTime = $this->messageService->differentTime($acRef->startTime, $acRef->endTime);
        $acRef->update();

        // Create new conversation
        $new_ac = ActiveConversations::query()->create([
            'custId' => $CUSTOMER['custId'],
            'roomId' => $roomId,
            'from_empCode' => $acRef->empCode,
            'from_roomId' => $acRef->roomId,
            'rateRef' => $current_rate->id,
        ]);

        $this->lineMessageService->storeMessage($CUSTOMER, $CUSTOMER, $message, $new_ac->id, $TOKEN);

        $message_send = [
            'text' => 'ระบบกำลังส่งต่อให้เจ้าหน้าที่ที่รับผิดชอบเพื่อเร่งดำเนินการเข้ามาสนทนา กรุณารอสักครู่',
            'type' => 'text'
        ];

        $this->lineMessageService->storeMessage($CUSTOMER, $BOT, $message_send, $new_ac->id, $TOKEN);

        $body_send = ['to' => $CUSTOMER['custId'], 'messages' => [$message_send]];
        $this->lineMessageService->pushMessage($body_send, $TOKEN);
    }

    private function forwardToDefaultRoom($CUSTOMER, $message, $current_rate, $acRef, $BOT, $TOKEN): void
    {
        $descriptions = PlatformAccessTokens::query()->where('id', $CUSTOMER['platformRef'])->first();

        $roomId = 'ROOM06'; // Default room

        if (($descriptions->description === 'pumpkintools') || ($descriptions->description === 'ศูนย์ซ่อม Pumpkin')) {
            $roomId = 'ROOM06';
        } elseif ($descriptions->description === 'ไลน์ dearler') {
            $roomId = 'ROOM09';
        }
        Log::channel('line_webhook_log')->info('forwardToDefaultRoom: ' . $roomId . '');

        $this->updateRateAndForwardToRoom($CUSTOMER, $message, $current_rate, $acRef, $roomId, $BOT, $TOKEN);
    }

    private function forwardToServiceRoom($CUSTOMER, $message, $current_rate, $acRef, $BOT, $TOKEN): void
    {
        $this->forwardToDefaultRoom($CUSTOMER, $message, $current_rate, $acRef, $BOT, $TOKEN);
    }

    private function handlePendingRateMessage($CUSTOMER, $message, $current_rate, $BOT, $TOKEN): void
    {
        $queueChat = Rates::query()
            ->where('status', 'pending')
            ->where('latestRoomId', $current_rate['latestRoomId'])
            ->select('id', 'updated_at', 'custId')
            ->orderBy('updated_at', 'asc')
            ->get();

        $count = 1;
        if (count($queueChat) > 0) {
            foreach ($queueChat as $key => $value) {
                if ($value->custId === $CUSTOMER['custId']) break;
                else $count++;
            }
        }

        $acId = ActiveConversations::query()
            ->where('rateRef', $current_rate['id'])
            ->orderBy('id', 'desc')->first();

        $this->lineMessageService->storeMessage($CUSTOMER, $CUSTOMER, $message, $acId->id, $TOKEN);
        $this->pusherService->sendNotification($CUSTOMER['custId']);

        $message_count = [
            'type' => 'text',
            'text' => 'คิวของท่านคือ ' . $count . ' คิว กรุณารอสักครู่'
        ];

        $this->lineMessageService->storeMessage($CUSTOMER, $BOT, $message_count, $acId->id, $TOKEN);

        $body = [
            'to' => $CUSTOMER['custId'],
            'messages' => [$message_count]
        ];

        $sendMshByLine = $this->lineMessageService->pushMessage($body, $TOKEN);
        if ($sendMshByLine['status']) $this->pusherService->sendNotification($CUSTOMER['custId']);
    }

    private function handleNewMessage($CUSTOMER, $message, $BOT, $TOKEN): void
    {
        if ($message['type'] === 'text') {
            $keyword = Keyword::query()->where('name', 'like', "%$message[text]%")->first();

            if ($keyword && $keyword->event !== true) {
                $this->createNewConversation($CUSTOMER, $message, $keyword->redirectTo, 'pending', $BOT, $TOKEN);
                $this->pusherService->sendNotification($CUSTOMER['custId']);
            } else {
                $this->createBotConversation($CUSTOMER, $message, $BOT, $TOKEN);
            }
        } else {
            $this->createBotConversation($CUSTOMER, $message, $BOT, $TOKEN);
        }
    }

    private function handlePostback($event): bool
    {
        try {
            $postBackData = $event['postback']['data'];
            $dataParts = explode(',', $postBackData);
            $feedback = $dataParts[0] ?? null;
            $rateIdPostback = $dataParts[1] ?? null;

            $rate = Rates::query()->where('id', $rateIdPostback)->first();
            $rate->rate = $feedback === 'like' ? 5 : 1;
            $rate->save();

            if ($feedback !== 'like') {
                $this->messageService->quickReplyMsgLine($rate, $event['replyToken']);
            }

            return true;
        } catch (\Exception $e) {
            $message = $e->getMessage() . $e->getLine() . $e->getFile();
            Log::channel('line_webhook_log')->error($message);
            return false;
        }
    }


    private function filterCaseSale($custId)
    {
        $found = SaleInformation::query()->where('sale_cust_id', $custId)->first();
        if ($found) {
            return true;
        } else {
            return false;
        }
    }

    private function createSaleChat($customer, $current_rate = null, $message)
    {
        if (!isset($current_rate) || ($current_rate && $current_rate->status === 'success')) {
            Log::info('สร้างเคสใหม่');
            $new_rate = Rates::query()->create([
                'custId' => $customer['custId'],
                'rate' => 0,
                'latestRoomId' => 'ROOM20',
                'status' => 'pending',
            ]);
            $new_ac = ActiveConversations::query()->create([
                'custId' => $customer['custId'],
                'roomId' => 'ROOM20',
                'rateRef' => $new_rate->id,
            ]);
            $new_chat = ChatHistory::query()->create([
                'custId' => $customer['custId'],
                'content' => $message['text'] ?? '',
                'contentType' => $message['type'],
                'sender' => $customer->toJson(),
                'conversationRef' => $new_ac->id,
                'line_quoteToken' => $message['quoteToken'] ?? null
            ]);
        } elseif (($current_rate && $current_rate->status === 'progress') || ($current_rate && $current_rate->status === 'pending')) {
            Log::info('ไม่สร้างเคสใหม่');
            $ac = ActiveConversations::query()->where('rateRef', $current_rate->id)->orderBy('id', 'desc')->first();
            $new_chat = ChatHistory::query()->create([
                'custId' => $customer['custId'],
                'content' => $message['text'] ?? '',
                'contentType' => $message['type'],
                'sender' => $customer->toJson(),
                'conversationRef' => $ac->id,
                'line_quoteToken' => $message['quoteToken'] ?? null
            ]);
        }else{
            Log::info('ไม่พบเคสที่เกี่ยวข้อง');
        }

        $this->pusherService->sendNotification($customer['custId']);
    }
}
