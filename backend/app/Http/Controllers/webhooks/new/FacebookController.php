<?php

namespace App\Http\Controllers\webhooks\new;

use App\Http\Controllers\Controller;
use App\Models\BotMenu;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\Services\PusherService;
use App\Services\webhooks_new\FilterCase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FacebookController extends Controller
{

    protected $start_log_line = '--------------------------------------------------🌞 เริ่มรับ webhook--------------------------------------------------';
    protected $end_log_line = '---------------------------------------------------🌚 สิ้นสุดรับ webhook---------------------------------------------------';
    protected FilterCase $filterCase;

    public function __construct(FilterCase $filterCase)
    {
        $this->filterCase = $filterCase;
    }
    public function verifyToken(Request $request)
    {
        $verify_token = '211044';
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');
        if ($mode === 'subscribe' && $token === $verify_token) {
            return response($challenge, 200);
        }
        return response('Forbidden', 403);
    }

    public function webhook(Request $request)
    {
        $platform_access_token = [];
        $customer = [];
        $messages = [];
        try {
            $req = $request->all();
            $entry = [];
            $messaging = [];
            if ($req['object'] === 'page') {
                $entry = $req['entry'][0];
                $messagings = $entry['messaging'];
                $page_id = $entry['id'];
                $check_platform = $this->check_platform($page_id);
                if ($check_platform) {
                    $platform_access_token = $check_platform['platform'];
                } else {
                    throw new \Exception($check_platform['message']);
                }
                foreach ($messagings as $key => $messaging) {
                    $sender_is_page = $this->checkSender($messaging['sender']['id']);
                    if ($sender_is_page) {
                        throw new \Exception('ผู้ส่งเป็น page ส่งเอง');
                    } else {
                        // เช็คต่อว่า เป็น event เป็น message หรือไม่
                        if (isset($messaging['message'])) {
                            Log::channel('webhook_facebook_new')->info($this->start_log_line);
                            Log::channel('webhook_facebook_new')->info(json_encode($request->all(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                            $customer_platform = $this->check_customer($messaging['sender']['id'], $platform_access_token);
                            $customer = $customer_platform['customer'];
                            $platform_access_token = $customer_platform['platform_access_token'];
                            if (isset($messaging['message']['text'])) {
                                $message_formatted = $this->format_message($messaging['message'], $messaging['message']['mid']);
                                $filter_case = $this->filterCase->filterCase($customer, $message_formatted, $platform_access_token);
                                Log::channel('webhook_facebook_new')->info('filter_case ', [
                                    'filter_case ' => json_encode($filter_case, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
                                ]);
                                if (isset($filter_case['status']) && $filter_case['status']) {
                                    $send_facebook = $this->reply_push_message($filter_case);
                                }
                            } elseif (isset($messaging['message']['attachments'])) {
                                foreach ($messaging['message']['attachments'] as $key => $attachment) {
                                    $message_formatted = $this->format_message($attachment, $messaging['message']['mid']);
                                    $filter_case = $this->filterCase->filterCase($customer, $message_formatted, $platform_access_token);
                                    Log::channel('webhook_facebook_new')->info('filter_case ', [
                                        'filter_case ' => json_encode($filter_case, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
                                    ]);
                                }
                            }
                            Log::channel('webhook_facebook_new')->info($this->end_log_line);
                        } else {
                            throw new \Exception('event ไม่ใช่ message');
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Log::channel('webhook_facebook_new')->error($e->getMessage() . 'บรรทัดที่ ' . $e->getLine() . $e->getFile());
        }

        return response()->json([
            'message' => 'ตอบกลับ webhook สําเร็จ',
        ], 200);
    }

    // เช็คว่า ผู้ส่งเป็นเพจหรือลูกค้า
    private function checkSender($sender_id)
    {
        $platforms = PlatformAccessTokens::query()->where('platform', 'facebook')->get();
        $sender_is_page = false;
        foreach ($platforms as $key => $platform) {
            if ($platform['fb_page_id'] == $sender_id) {
                $sender_is_page = true;
                break;
            }
        }
        return $sender_is_page;
    }

    private function check_customer($sender_id, $platform_access_token)
    {
        $customer = Customers::query()->where('custId', $sender_id)->first();
        if ($customer) {
            $platform = PlatformAccessTokens::query()->where('id', $customer['platformRef'])->first();
            return [
                'customer' => $customer,
                'platform_access_token' => $platform
            ];
        } else {
            $platforms = PlatformAccessTokens::query()->where('platform', 'facebook')->get();
            foreach ($platforms as $key => $platform) {
                $page_id = $platform['fb_page_id'];
                $uri = "https://graph.facebook.com/v23.0/$page_id/messages";
                $response = Http::withToken($platform['access_token'])->post($uri, [
                    'messaging_type' => 'RESPONSE',
                    'recipient' => [
                        'id' => $sender_id
                    ],
                    'message' => ['text' => "ยินดีต้อนรับ 🙏"]
                ]);
                if ($response->successful() && $response->status() === 200) {
                    $new_customer = Customers::query()->create([
                        'custId' => $sender_id,
                        'custName' => "ผู้ใช้ รหัส $sender_id",
                        'description' => 'ติดต่อมาจากเพจ Facebook ' . $platform['description'],
                        'avatar' => null,
                        'platformRef' => $platform['id']
                    ]);
                    return [
                        'customer' => $new_customer,
                        'platform_access_token' => $platform
                    ];
                }
            }
            return null;
        }
        return null;
    }

    private function check_platform($page_id)
    {
        $platform_access_token = PlatformAccessTokens::query()
            ->where('fb_page_id', $page_id)
            ->where('platform', 'facebook')
            ->first();
        if ($platform_access_token) {
            return [
                'status' => true,
                'message' => 'เจอ platform ใน database',
                'platform' => $platform_access_token
            ];
        } else {
            return [
                'status' => false,
                'message' => 'ไม่เจอ platform ใน database',
                'platform' => []
            ];
        }
    }

    private function format_message($message, $message_id)
    {
        $message_formated = [];
        $message_formated['message_id'] = $message_id;
        $message_formated['reply_token'] = '';
        if (isset($message['text'])) {
            $message_formated['content'] = $message['text'];
            $message_formated['contentType'] = 'text';
        } elseif (isset($message['type']) && $message['type'] === 'image' && isset($message['payload']['sticker_id'])) {
            $message_formated['content'] = $message['payload']['url'];
            $message_formated['contentType'] = 'sticker';
        } elseif (isset($message['type']) && $message['type'] === 'image') {
            $message_formated['content'] = $message['payload']['url'];
            $message_formated['contentType'] = 'image';
        } elseif (isset($message['type']) && $message['type'] === 'video') {
            $message_formated['content'] = $message['payload']['url'];
            $message_formated['contentType'] = 'video';
        } elseif (isset($message['type']) && $message['type'] === 'audio') {
            $message_formated['content'] = $message['payload']['url'];
            $message_formated['contentType'] = 'audio';
        } else {
            $message_formated['content'] = "รหัสข้อความ $message_id";
            $message_formated['contentType'] = 'text';
        }
        return $message_formated;
    }

    public static function reply_push_message($filter_case_response)
    {
        try {
            $filter_case = $filter_case_response['case'] ?? $filter_case_response;
            if (!$filter_case['send_to_cust']) {
                return [
                    'status' => true,
                    'message' => 'ไม่ใช่การตอบกลับไปยังลูกค้า'
                ];
            }
            $messages = $filter_case['messages'];
            $message_formated = [];
            foreach ($messages as $key => $message) {
                switch ($message['contentType']) {
                    case 'text':
                        $message_formated[$key]['text'] = $message['content'];
                        break;
                    case 'image':
                        $message_formated[$key]['attachment']['payload']['url'] = $message['content'];
                        $message_formated[$key]['attachment']['type'] = 'image';
                        break;
                    case 'video':
                        $message_formated[$key]['attachment']['payload']['url'] = $message['content'];
                        $message_formated[$key]['attachment']['type'] = 'video';
                        break;
                    case 'audio':
                        $message_formated[$key]['attachment']['payload']['url'] = $message['content'];
                        $message_formated[$key]['attachment']['type'] = 'audio';
                        break;
                    case 'file':
                        $message_formated[$key]['attachment']['payload']['url'] = $message['content'];
                        $message_formated[$key]['attachment']['type'] = 'file';
                        break;
                    default:
                        return [
                            'status' => false,
                            'message' => 'ไม่รู้จัก contentType'
                        ];
                }
            }


            // if ($filter_case['type_send'] === 'menu') {
            //     $bot_menu_list = BotMenu::query()
            //         ->where('botTokenId', $filter_case['platform_access_token']['id'])
            //         ->orderBy('menu_number', 'asc')
            //         ->get();
            //     $text_menu = "กรุณาเลือกเมนูที่ต้องการ\nโดยพิพม์เลขที่ต้องการเช่น 1\n";
            //     foreach ($bot_menu_list as $key => $menu) {
            //         $text_menu .= $key + 1 . "." . $menu['menuName'] . "\n";
            //     }
            //     $latest_length = count($message_formated);
            //     $message_formated[$latest_length]['text'] = $text_menu;
            // }

            if ($filter_case['type_send'] === 'menu') {
                $bot_menu_list = BotMenu::query()
                    ->where('botTokenId', $filter_case['platform_access_token']['id'])
                    ->orderBy('menu_number', 'asc')
                    ->get();

                $quick_replies = [];
                foreach ($bot_menu_list as $key => $menu) {
                    $number = $key + 1; // เลขเมนู
                    $quick_replies[] = [
                        "content_type" => "text",
                        "title" => $number . ". " . $menu['menuName'], // แสดงชื่อเมนู
                        "payload" => (string)$number // ส่งแค่เลข
                    ];
                }

                $message_formated[] = [
                    "text" => "กรุณาเลือกเมนูที่ต้องการ",
                    "quick_replies" => $quick_replies
                ];
            }


            $recipient_id = $filter_case['customer']['custId'];
            $access_token = $filter_case['platform_access_token']['accessToken'];
            $page_id = $filter_case['platform_access_token']['fb_page_id'];
            $uri = "https://graph.facebook.com/v23.0/$page_id/messages";
            foreach ($message_formated as $key => $m) {
                $send_to_facebook = Http::post($uri, [
                    'messaging_type' => 'RESPONSE',
                    'recipient' => ['id' => $recipient_id],
                    'message' => $m,
                    'access_token' => $access_token
                ]);
                if ($send_to_facebook->successful() && $send_to_facebook->status() === 200) {
                    $save_chat = new ChatHistory();
                    $save_chat['custId'] = $recipient_id;
                    $save_chat['content'] = isset($m['text']) ? $m['text'] : $m['attachment']['payload']['url'];
                    $save_chat['contentType'] = isset($m['text']) ? 'text' : $m['attachment']['type'];
                    if ($filter_case['type_send'] === 'present' || $filter_case['type_send'] === 'normal') {
                        $save_chat['sender'] = json_encode($filter_case['employee']);
                    } else {
                        $save_chat['sender'] = json_encode($filter_case['bot']);
                    }
                    $save_chat['line_message_id'] = null;
                    $save_chat['line_quote_token'] = null;
                    $save_chat['line_quoted_message_id'] = null;
                    $save_chat['conversationRef'] = $filter_case['ac_id'];
                    $save_chat->save();
                } else {
                    Log::channel('webhook_facebook_new')->info($send_to_facebook->body());
                }
                $pusherService = new PusherService();
                if ($filter_case['type_send'] === 'present') {
                    $pusherService->sendNotification($filter_case['customer']['custId'], 'มีการรับเรื่อง');
                } else {
                    $pusherService->sendNotification($filter_case['customer']['custId']);
                }
            }
            return [
                'status' => true,
                'message' => 'ส่งข้อความสําเร็จ'
            ];
        } catch (\Exception $e) {
            return [
                'status' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
