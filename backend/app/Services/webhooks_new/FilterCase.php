<?php

namespace App\Services\webhooks_new;

use App\Models\ActiveConversations;
use App\Models\BotMenu;
use App\Models\ChatHistory;
use App\Models\ChatRooms;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\Models\Rates;
use App\Models\User;
use App\Services\PusherService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class FilterCase
{
    protected $MESSAGE;
    protected $CUSTOMER;
    protected $PLATFORM_ACCESS_TOKEN;
    protected $BOT;
    protected $BOT_FACEBOOK;
    protected NewCase $newCase;
    protected ProgressCase $progressCase;
    protected PendingCase $pendingCase;
    protected SuccessCase $successCase;
    protected PusherService $pusherService;
    public function __construct(NewCase $newCase, ProgressCase $progressCase, PendingCase $pendingCase, SuccessCase $successCase, PusherService $pusherService)
    {
        $this->newCase = $newCase;
        $this->progressCase = $progressCase;
        $this->pendingCase = $pendingCase;
        $this->successCase = $successCase;
        $this->pusherService = $pusherService;
    }
    protected $end_log_line = '---------------------------------------------------🌚 สิ้นสุดกรองเคส---------------------------------------------------';

    public function filterCase($customer = null, $message = null, $platformAccessToken = null, $flow = 1)
    {
        Log::channel('webhook_main')->info('เริ่มกรองเคส', [
            'customer' => json_encode($customer, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            'message' => json_encode($message, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            'platformAccessToken' => json_encode($platformAccessToken, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        ]);
        try {

            // เช็คก่อนว่า มี $customer หรือ $message หรือ $platformAccessToken ครบทั้งสามอย่างหรือไม่
            $check_params = $this->checkParams($customer, $message, $platformAccessToken);
            //ดึงข้อมูล BOT ของแต่ละ platform
            $this->BOT = User::query()->where('empCode', 'BOT')->first();
            if (!$check_params['status']) throw new \Exception($check_params['message']);
            $this->MESSAGE = $message;
            $this->CUSTOMER = $customer;
            $this->PLATFORM_ACCESS_TOKEN = $platformAccessToken;

            // ตรวจสอบ Rate ปัจจุบันก่อน
            $current_rate = Rates::query()->where('custId', $customer['custId'])
                ->orderBy('id', 'desc')->first();

            if ($current_rate) {
                $is_spam = $this->isSpam($current_rate, $customer, $message);
                if ($is_spam['status']) {
                    return $is_spam;
                }
            }

            switch ($flow) {
                case 1:
                    return $this->caseFlow1($current_rate);
                    break;
                case 2:
                    return $this->caseFlow2($customer, $message, $platformAccessToken, $current_rate);
                    break;
                default:
                    return ['status' => false, 'message' => 'ไม่พบ flow ที่ต้องการ'];
            }
        } catch (\Exception $e) {
            return ['status' => false, 'message' => $e->getMessage() . ' ' . $e->getFile() . ' ' . $e->getLine()];
        }
    }

    private function checkParams($customer = null, $message = null, $platformAccessToken = null)
    {
        try {
            // ถ้าไม่เจอ $customer หรือ $message หรือ $platformAccessToken
            if (is_null($customer) || is_null($message) || is_null($platformAccessToken)) {
                if (is_null($customer)) throw new \Exception('ไม่พบ customer');
                elseif (is_null($message)) throw new \Exception('ไม่พบ message');
                else throw new \Exception('ไม่พบ platformAccessToken');
            } else return ['status' => true, 'message' => 'ตรวจสอบสําเร็จ'];
        } catch (\Exception $e) {
            $msg_error = $e->getMessage() . ' ' . $e->getFile() . ' ' . $e->getLine();
            $msg_error_default = 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ ใน fn checkParams';
            return [
                'status' => false,
                'message' => $msg_error ?? $msg_error_default
            ];
        }
    }

    private function caseFlow1($current_rate = null)
    {
        if (!$current_rate) {
            $case = $this->newCase->case($this->MESSAGE, $this->CUSTOMER, $this->PLATFORM_ACCESS_TOKEN, $this->BOT);
        } elseif ($current_rate['status'] === 'pending') {
            $case = $this->pendingCase->case($this->MESSAGE, $current_rate, $this->CUSTOMER, $this->PLATFORM_ACCESS_TOKEN, $this->BOT);
        } elseif ($current_rate['status'] === 'progress') {
            $case = $this->progressCase->case($this->MESSAGE, $current_rate, $this->CUSTOMER, $this->PLATFORM_ACCESS_TOKEN, $this->BOT);
        } else {
            $case = $this->successCase->case($this->MESSAGE, $current_rate, $this->CUSTOMER, $this->PLATFORM_ACCESS_TOKEN, $this->BOT);
        }
        Log::channel('webhook_main')->info($this->end_log_line); //สิ้นสุดกรองเคส
        return ['status' => true, 'case' => $case];
    }

    private function caseFlow2($customer, $message, $platformAccessToken, $current_rate)
    {
        try {
            // ฟังก์ชันสร้างแชทใหม่
            $createChat = function ($custId, $message, $customer, $ac_id) {
                return ChatHistory::query()->create([
                    'custId' => $custId,
                    'contentType' => $message['contentType'],
                    'content' => $message['content'],
                    'sender' => json_encode($customer),
                    'conversationRef' => $ac_id,
                    'line_message_id' => $message['line_message_id'] ?? null,
                    'line_quote_token' => $message['line_quote_token'] ?? null,
                    'line_quoted_message_id' => $message['line_quoted_message_id'] ?? null,
                ]);
            };

            // ฟังก์ชันส่ง notification + response
            $sendResponse = function ($customer, $acId, $platformAccessToken, $reply_token, $bot) {
                (new PusherService())->sendNotification($customer['custId']);
                return [
                    'status' => true,
                    'send_to_cust' => false,
                    'type_send' => 'normal',
                    'type_message' => 'reply',
                    'messages' => [[
                        'content' => 'รับข้อความเรียบร้อยแล้ว',
                        'contentType' => 'text'
                    ]],
                    'customer' => $customer,
                    'ac_id' => $acId,
                    'platform_access_token' => $platformAccessToken,
                    'reply_token' => $reply_token,
                    'bot' => $bot
                ];
            };

            if ($current_rate && $current_rate['status'] === 'success') {
                $new_rate = Rates::query()->create([
                    'custId' => $customer['custId'],
                    'latestRoomId' => $platformAccessToken['room_default_id'],
                    'rate' => 0,
                    'status' => 'pending'
                ]);
                $new_ac = ActiveConversations::query()->create([
                    'custId' => $customer['custId'],
                    'roomId' => $new_rate['latestRoomId'],
                    'rateRef' => $new_rate['id']
                ]);
                $createChat($customer['custId'], $message, $customer, $new_ac['id']);
                return $sendResponse($customer, $new_ac['id'], $platformAccessToken, $message['reply_token'], $this->BOT);
            } elseif ($current_rate && in_array($current_rate['status'], ['pending', 'progress'])) {
                $ac = ActiveConversations::query()
                    ->where('rateRef', $current_rate['id'])
                    ->orderBy('id', 'desc')
                    ->first();
                $createChat($customer['custId'], $message, $customer, $ac['id']);
                return $sendResponse($customer, $ac['id'], $platformAccessToken, $message['reply_token'], $this->BOT);
            } else {
                $new_rate = Rates::query()->create([
                    'custId' => $customer['custId'],
                    'latestRoomId' => $platformAccessToken['room_default_id'],
                    'rate' => 0,
                    'status' => 'pending'
                ]);
                $new_ac = ActiveConversations::query()->create([
                    'custId' => $customer['custId'],
                    'roomId' => $new_rate['latestRoomId'],
                    'rateRef' => $new_rate['id']
                ]);
                $createChat($customer['custId'], $message, $customer, $new_ac['id']);
                return $sendResponse($customer, $new_ac['id'], $platformAccessToken, $message['reply_token'], $this->BOT);
            }
        } catch (\Throwable $e) {
            return ['status' => false, 'message' => $e->getMessage() . ' ' . $e->getFile() . ' ' . $e->getLine()];
        }
    }

    private function isSpam($current_rate, $customer, $message)
    {
        try {
            $new_ac = ActiveConversations::query()
                ->where('rateRef', $current_rate['id'])
                ->orderBy('id', 'desc')
                ->first();

            $one_char = substr($message['content'], 0, 1);
            $latest_room_id = $current_rate['latestRoomId'];

            $room_spam = ChatRooms::query()
                ->where('roomId', $latest_room_id)
                ->where('is_spam', true)
                ->first();

            $platformAccessToken = PlatformAccessTokens::query()
                ->where('id', $customer['platformRef'])
                ->first();

            $bot = User::query()->where('empCode', 'BOT')->first();

            if ($room_spam) {                                                                                                                                                                                                                                                                                                                     
                if ($new_ac) {
                    ChatHistory::query()->create([
                        'custId'            => $customer['custId'],
                        'content'           => $message['content'],
                        'contentType'       => $message['contentType'],
                        'sender'            => json_encode($customer),
                        'conversationRef'   => $new_ac['id'],
                        'line_message_id'   => $message['line_message_id'] ?? null,
                        'line_quote_token'  => $message['line_quote_token'] ?? null,
                        'line_quoted_message_id' => $message['line_quoted_message_id'] ?? null,
                    ]);
                    $this->pusherService->sendNotification($customer['custId']);
                }

                $menus = BotMenu::query()
                    ->where('botTokenId', $customer['platformRef'])
                    ->get();

                foreach ($menus as $menu) {
                    if ($one_char == $menu['menu_number']) {
                        $foward_to_room_id = $menu['roomId'];

                        if ($new_ac) {
                            $new_ac->update([
                                'receiveAt' => Carbon::now(),
                                'startTime' => Carbon::now(),
                                'endTime'   => Carbon::now(),
                                'empCode'   => 'BOT',
                            ]);
                        }

                        $old_room_id = $current_rate['latestRoomId'];

                        $current_rate->update([
                            'latestRoomId' => $foward_to_room_id,
                            'status'       => 'pending',
                        ]);

                        $new_ac_new = ActiveConversations::query()->create([
                            'custId'       => $customer['custId'],
                            'roomId'       => $current_rate['latestRoomId'],
                            'empCode'      => $bot['empCode'],
                            'rateRef'      => $current_rate['id'],
                            'from_empCode' => $new_ac['empCode'] ?? null,
                            'from_roomId'  => $old_room_id,
                        ]);

                        $case = [
                            'status'   => true,
                            'send_to_cust' => true,
                            'type_send'    => 'menu_sended',
                            'type_message' => 'reply',
                            'messages' => [[
                                'content'     => 'ระบบกำลังส่งต่อให้เจ้าหน้าที่ กรุณารอซักครู่',
                                'contentType' => 'text',
                            ]],
                            'customer'             => $customer,
                            'ac_id'                => $new_ac_new['id'],
                            'platform_access_token' => $platformAccessToken,
                            'reply_token'          => $message['reply_token'] ?? null,
                            'bot'                  => $bot,
                        ];
                        return ['status' => true, 'case' => $case];
                    }
                }

                $case = [
                    'status'   => true,
                    'send_to_cust' => true,
                    'type_send'    => 'menu',
                    'type_message' => 'reply',
                    'messages' => [[
                        'content'     => 'ขณะนี้คุณกำลังอยู่ในห้องสแปม หากต้องการติดต่อกับเรา กรุณาโปรดเลือก เมนู ด้านล่าง',
                        'contentType' => 'text',
                    ]],
                    'customer'             => $customer,
                    'ac_id'                => $new_ac['id'] ?? null,
                    'platform_access_token' => $platformAccessToken,
                    'reply_token'          => $message['reply_token'] ?? 'reply Token',
                    'bot'                  => $bot,
                ];
                return ['status' => true, 'case' => $case];
            }

            return ['status' => false, 'case' => []];
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return ['status' => false, 'case' => []];
        }
    }
}