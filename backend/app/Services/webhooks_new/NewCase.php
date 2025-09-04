<?php

namespace App\Services\webhooks_new;

use App\Models\ActiveConversations;
use App\Models\BotMenu;
use App\Models\ChatHistory;
use App\Models\Rates;
use App\Services\PusherService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class NewCase
{

    protected CheckKeyword $checkKeyword;
    protected PusherService $pusherService;

    public function __construct(CheckKeyword $checkKeyword, PusherService $pusherService)
    {
        $this->checkKeyword = $checkKeyword;
        $this->pusherService = $pusherService;
    }

    public function case($message, $customer, $platformAccessToken, $bot)
    {
        try {
            Log::channel('webhook_main')->info('ปัจจุบันเป็นเคสใหม่ ไม่เคยสร้างเคส');
            $now = Carbon::now();

            // เช็คข้อความลูกค้าว่าตรงตาม keyword หรือไม่ ถ้าตรงให้่ส่งไปยังห้องนั้นๆ
            $keyword = $this->checkKeyword->check($message);
            if ($keyword['status']) {
                $new_rate = Rates::query()->create([
                    'custId' => $customer['custId'],
                    'latestRoomId' => $keyword['redirectTo'],
                    'status' => 'pending',
                    'rate' => 0,
                ]);
            } else {
                $new_rate = Rates::query()->create([
                    'custId' => $customer['custId'],
                    'latestRoomId' => 'ROOM00',
                    'status' => 'progress',
                    'rate' => 0,
                ]);
            }

            $new_ac = ActiveConversations::query()->create([
                'custId' => $customer['custId'],
                'roomId' => $new_rate['latestRoomId'],
                'receiveAt' => $new_rate['status'] === 'pending' ? null : $now,
                'startTime' => $new_rate['status'] === 'pending' ? null : $now,
                'empCode' => $bot['empCode'],
                'rateRef' => $new_rate['id']
            ]);
            $store_chat = ChatHistory::query()->create([
                'custId' => $customer['custId'],
                'content' => $message['content'],
                'contentType' => $message['contentType'],
                'sender' => json_encode($customer),
                'conversationRef' => $new_ac['id'],
                'line_message_id' => $message['line_quote_token'] ?? null,
                'line_quote_token' => $message['line_quote_token'] ?? null,
                'line_quoted_message_id' => $message['line_quoted_message_id'] ?? null,
            ]);
            $this->pusherService->sendNotification($customer['custId']);

            $msg_bot = [];


            // เช็คว่า อยู่ห้องไหน ถ้าอยู่ห้องบอท ให้ ส่งเมนูไป ถ้าไม่ใช่ ให้ส่งข้อความ ระบบได้ส่งให้เจ้าหน้าที่กรุณารอสักครู่
            if ($new_rate['latestRoomId'] === 'ROOM00') {
                $content = "สวัสดีคุณ" . $customer['custName'];
                $content = $content . "เพื่อให้การบริการของเราดำเนินไปอย่างรวดเร็วและสะดวกยิ่งขึ้น";
                $content = $content . "กรุณาเลือกหัวข้อด้านล่าง เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลและบริการท่านได้อย่างถูกต้องและรวดเร็ว ขอบคุณค่ะ/ครับ";
                return [
                    'status' => true,
                    'send_to_cust' => true,
                    'type_send' => 'menu',
                    'type_message' => 'reply',
                    'messages' => [
                        [
                            'content' => $content,
                            'contentType' => 'text'
                        ]
                    ],
                    'customer' => $customer,
                    'ac_id' => $new_ac['id'],
                    'platform_access_token' => $platformAccessToken,
                    'reply_token' => $message['reply_token'],
                    'bot' => $bot
                ];
            } else {
                return [
                    'status' => true,
                    'send_to_cust' => true,
                    'type_send' => 'sended',
                    'type_message' => 'reply',
                    'messages' => [
                        [
                            'content' => 'ระบบกำลังส่งต่อให้เจ้าหน้าที่ กรุณารอซักครู่',
                            'contentType' => 'text'
                        ]
                    ],
                    'customer' => $customer,
                    'ac_id' => $new_ac['id'],
                    'platform_access_token' => $platformAccessToken,
                    'reply_token' => $message['reply_token'],
                    'bot' => $bot
                ];
            }
            Log::channel('webhook_main')->info('สร้างเคสใหม่สำเร็จ');
        } catch (\Exception $e) {
            Log::channel('webhook_main')->error('เกิดข้อผิดพลาดในการสร้างเคสใหม่: ' . $e->getMessage());
            return ['status' => false, 'message' => 'เกิดข้อผิดพลาดในการสร้างเคสใหม่: ' . $e->getMessage()];
        }
    }

    public static function formatBotMenu($custName, $platForm, $platFrom_id)
    {
        $msg_bot = [];
        switch (strtoupper($platForm)) {
            case 'LINE':
                $msg_bot[0]['text'] = "สวัสดีคุณ " . $custName . " เพื่อให้การบริการของเราดำเนินไปอย่างรวดเร็วและสะดวกยิ่งขึ้น กรุณาเลือกหัวข้อด้านล่าง เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลและบริการท่านได้อย่างถูกต้องและรวดเร็ว ขอบคุณค่ะ/ครับ";
                $msg_bot[0]['type'] = 'text';
                $msg_bot[1]['type'] = 'template';
                $msg_bot[1]['altText'] = 'this is a buttons template';
                $msg_bot[1]['template']['type'] = 'buttons';
                $msg_bot[1]['template']['imageBackgroundColor'] = '#FFFFFF';
                $msg_bot[1]['template']['title'] = 'ยินดีต้อนรับ 🤖';
                $msg_bot[1]['template']['text'] = 'กรุณาเลือกเมนูที่ท่านต้องการสอบถาม';
                $menu_list = BotMenu::query()->where('botTokenId', $platFrom_id)->orderBy('id')->get();
                if (count($menu_list) > 0) {
                    foreach ($menu_list as $key => $menu) {
                        $msg_bot[1]['template']['actions'][$key] = [
                            'type' => 'message',
                            'label' => $menu['menuName'],
                            'text' => $menu['menuName'],
                        ];
                    }
                } else {
                    $msg_bot[1]['template']['actions'][0] = [
                        'type' => 'message',
                        'label' => 'สอบถาม / อื่นๆ',
                        'text' => 'สอบถาม / อื่นๆ'
                    ];
                }
                break;
            default:
                $msg_bot[0]['text'] = "เพิ่ม message ที่นี่";
                $msg_bot[0]['type'] = 'text';
        }
        return $msg_bot;
    }
}
