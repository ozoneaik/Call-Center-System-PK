<?php

namespace App\Http\Controllers\webhooks\new;

use App\Http\Controllers\Controller;
use App\Models\BotMenu;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\Services\PusherService;
use App\Services\webhooks_new\FilterCase;
use Aws\S3\S3Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use LINE\Clients\MessagingApi\Api\MessagingApiApi;
use LINE\Clients\MessagingApi\Configuration;

class LineWebhookController extends Controller
{

    protected $start_log_line = '--------------------------------------------------🌞 เริ่มรับ webhook--------------------------------------------------';
    protected $end_log_line = '---------------------------------------------------🌚 สิ้นสุดรับ webhook---------------------------------------------------';

    protected FilterCase $filterCase;

    public function __construct(FilterCase $filterCase)
    {
        $this->filterCase = $filterCase;
    }

    public function webhook(Request $request)
    {
        Log::channel('webhook_line_new')->info($this->start_log_line); //เริ่มรับ webhook
        Log::info('รับ webhook จาก Line');
        try {
            $req = $request->all();
            Log::channel('webhook_line_new')->info(json_encode($req, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            $events = $req['events'];
            foreach ($events as $key => $event) {
                if ($event['type'] === 'message') {
                    Log::channel('webhook_line_new')->info('event index = ' . $key . 'เป็น message 💬');
                    $event_user_id = $event['source']['userId'];

                    $cust_and_platform = $this->checkCustomer($event_user_id);
                    if ($cust_and_platform['customer'] && $cust_and_platform['platform']) {
                        $platform = $cust_and_platform['platform'];
                        $customer = $cust_and_platform['customer'];
                        Log::channel('webhook_line_new')->info('เจอผู้ใช้ในระบบ: ' . json_encode($customer, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                        Log::channel('webhook_line_new')->info('จาก platform: ' . json_encode($platform, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

                        // จัดรูปแบบข้อความก่อน
                        $message = $event['message'];
                        $formatted_message = $this->formatMessage($message, $platform['accessToken'], $event['replyToken']);
                        Log::channel('webhook_line_new')->info('ข้อความที่ได้รับ: ' . json_encode($formatted_message, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

                        // เข้าสุ่ filterCase
                        $filter_case = $this->filterCase->filterCase($customer, $formatted_message, $platform);
                        $send_line = $this->ReplyPushMessage($filter_case);
                        if (!$send_line['status']) {
                            throw new \Exception($send_line['message']);
                        }
                    } else {
                        throw new \Exception('ไม่พบข้อมูลผู้ใช้ในระบบ');
                    }
                } else {
                    Log::channel('webhook_line_new')->error('event index = ' . $key . 'ไม่ใช่ประเภท message');
                }
            }
        } catch (\Exception $e) {
            $msg_error = 'เกิดข้อผิดพลาดในการตอบกลับ webhook: ';
            $msg_error .= $e->getMessage() . ' | ' . 'ไฟล์ที่: ' . $e->getFile() . ' | ' . 'บรรทัดที่: ' . $e->getLine();
            Log::channel('webhook_line_new')->error('เกิดข้อผิดพลาด ❌ : ' . $e->getMessage());
        }
        Log::channel('webhook_line_new')->info($this->end_log_line); //สิ้นสุดรับ webhook

        return response()->json([
            'message' => 'ตอบกลับ webhook สําเร็จ',
        ]);
    }

    private function checkCustomer($custId)
    {
        $check_customer = Customers::query()->where('custId', $custId)->first();
        if ($check_customer) {
            $platform = PlatformAccessTokens::query()->where('platform', 'line')
                ->where('id', $check_customer['platformRef'])->first();
            return [
                'customer' => $check_customer,
                'platform' => $platform
            ];
        } else {
            $client = new Client();
            $config = new Configuration();
            $platform_list = PlatformAccessTokens::query()->where('platform', 'line')->get();
            foreach ($platform_list as $token) {
                try {
                    $config->setAccessToken($token['accessToken']);
                    $messagingApi = new MessagingApiApi(client: $client, config: $config);
                    $response = $messagingApi->getProfile($custId); // อาจ throw exception ถ้าไม่เจอ

                    // ถ้าเรียกสำเร็จ แปลว่าเจอลูกค้า
                    $customer = Customers::query()->create([
                        'custId' => $custId,
                        'custName' => $response->getDisplayName() ?? 'ไม่พบชื่อ',
                        'avatar' => $response->getPictureUrl() ?? null,
                        'description' => 'ติดต่อมาจากไลน์ ' . $token['description'],
                        'platformRef' => $token['id']
                    ]);

                    return [
                        'customer' => $customer,
                        'platform' => $token
                    ];
                } catch (\Exception $e) {
                    // บันทึก log ไว้เพื่อ debug ได้
                    Log::channel('webhook_line_new')->warning('getProfile ล้มเหลว', [
                        'custId' => $custId,
                        'token_id' => $token['id'],
                        'error' => $e->getMessage()
                    ]);
                }
            }

            return [
                'customer' => null,
                'platform' => null
            ];
        }
    }

    private function formatMessage($message, $accessToken, $reply_token)
    {
        $msg_type = $message['type'] ?? null;
        $msg_formated = [];
        if ($msg_type === 'text') {
            $msg_formated['contentType'] = 'text';
            $msg_formated['content'] = $message['text'] ?? 'ข้อความว่าง';
        } elseif ($msg_type === 'image' || $msg_type === 'video' || $msg_type === 'audio' || $msg_type === 'file') {
            $msg_formated['contentType'] = $msg_type;
            $msg_formated['content'] = $this->getUrlMedia($message['id'], $accessToken);
        } elseif ($msg_type === 'sticker') {
            $url_sticker = 'https://stickershop.line-scdn.net/stickershop/v1/sticker/' . $message['stickerId'] . '/iPhone/sticker.png';
            $msg_formated['contentType'] = 'sticker';
            $msg_formated['content'] =  $url_sticker;
        } elseif ($msg_type === 'location') {
            $latitude = $message['latitude'];
            $longitude = $message['longitude'];
            $location_url = 'https://www.google.com/maps/search/?api=1&q=' . $latitude . ',' . $longitude;
            $msg_formated['contentType'] = 'location';
            $msg_formated['content'] =  'ที่อยู่ => ' . $location_url;
        } else {
            $msg_formated['contentType'] = 'text';
            $msg_formated['content'] =  'ไม่รู้จักประเภทข้อความ';
        }
        $msg_formated['reply_token'] = $reply_token;
        $msg_formated['line_message_id'] = $message['id'] ?? null;
        $msg_formated['line_quote_token'] = $message['quoteToken'] ?? null;
        $msg_formated['line_quoted_message_id'] = $message['quotedMessageId'] ?? null;
        return $msg_formated;
    }

    private function getUrlMedia($mediaId, $accessToken)
    {
        $full_url = '';
        $endpoint = "https://api-data.line.me/v2/bot/message/$mediaId/content";

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
            ])->get($endpoint);

            if ($response->successful()) {
                $mediaContent = $response->body();
                $contentType = $response->header('Content-Type');

                $extension = match ($contentType) {
                    'image/jpeg' => '.jpg',
                    'image/png' => '.png',
                    'image/gif' => '.gif',
                    'video/mp4' => '.mp4',
                    'video/webm' => '.webm',
                    'video/ogg' => '.ogg',
                    'video/avi' => '.avi',
                    'video/mov' => '.mov',
                    'audio/x-m4a' => '.m4a',
                    'application/pdf' => '.pdf',
                    'application/zip' => '.zip',
                    'application/msword' => '.doc',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => '.docx',
                    'application/vnd.ms-excel' => '.xls',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => '.xlsx',
                    'application/vnd.ms-powerpoint' => '.ppt',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation' => '.pptx',
                    default => '.bin',
                };

                $mediaPath = $mediaId . $extension;

                // อัปโหลดขึ้น S3 แบบ private โดยใช้ Flysystem ผ่าน Laravel Storage
                Storage::disk('s3')->put($mediaPath, $mediaContent, [
                    'visibility'  => 'private', // หรือ 'public'
                    'ContentType' => $contentType,
                ]);

                $url = Storage::disk('s3')->url($mediaPath);
                $full_url = $url;
            } else {
                throw new \Exception('ไม่สามารถดึงสื่อจาก LINE ได้');
            }
        } catch (\Exception $e) {
            Log::channel('webhook_line_new')->error('❌ ไม่สามารถดึง URL ของสื่อได้: ' . $e->getMessage());
            $full_url = 'ไม่สามารถดึง URL ของสื่อได้';
        }

        return $full_url;
    }

    public static function ReplyPushMessage($filter_case_response)
    {
        try {
            $filter_case_response = $filter_case_response['case'] ?? $filter_case_response;
            Log::channel('webhook_line_new')->info('🤖🤖🤖🤖🤖🤖🤖');
            Log::channel('webhook_line_new')->info(json_encode($filter_case_response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            Log::channel('webhook_line_new')->info('🤖🤖🤖🤖🤖🤖🤖');
            if (!$filter_case_response['send_to_cust']) {
                return [
                    'status' => true,
                    'message' => 'ตอบกลับสำเร็จ'
                ];
            }
            $message_formated = [];
            $reply_token = $filter_case_response['reply_token'] ?? '';
            $platform_access_token = $filter_case_response['platform_access_token'] ?? '';
            foreach ($filter_case_response['messages'] as $key => $message) {
                $message_formated[$key] = [
                    'type' => $message['contentType'] ?? 'text',
                    'text' => $message['content'] ?? '',
                    'imageUrl' => $message['content'] ?? '',
                    'videoUrl' => $message['content'] ?? '',
                    'audioUrl' => $message['content'] ?? '',
                    'location' => $message['content'] ?? '',
                    'stickerId' => $message['content'] ?? '',
                ];
            }
            switch ($filter_case_response['type_send']) {
                case 'menu':
                    $latest_key = count($message_formated);
                    $botMenu = BotMenu::query()
                        ->where('botTokenId', $filter_case_response['platform_access_token']['id'])
                        ->orderBy('menu_number')->get();
                    $actions = [];
                    foreach ($botMenu as $key => $menu) {
                        $actions[$key]['type'] = 'message';
                        $actions[$key]['label'] = $menu['menuName'];
                        $actions[$key]['text'] = (string) $menu['menu_number'];
                    }
                    $message_formated[$latest_key] = [
                        'type' => 'template',
                        'altText' => 'เมนูหลัก',
                        'template' => [
                            'title' => 'ยินดีต้อนรับ 🤖',
                            'text' => 'กรุณาเลือกเมนูที่ท่านต้องการสอบถาม พิมพ์เลขที่ต้องการ เช่น "1"',
                            'type' => 'buttons',
                            'actions' => $actions
                        ]
                    ];
                    break;
                case 'menu_sended':
                    break;
                case 'queue':
                    break;
                case 'present':
                    break;
                case 'normal':
                    break;
                default:
                    break;
            }
            if ($filter_case_response['type_message'] === 'reply') {
                $uri = 'https://api.line.me/v2/bot/message/reply';
                $data = [
                    'replyToken' => $reply_token,
                    'messages' => $message_formated
                ];
                $header = [
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $platform_access_token['accessToken']
                ];
            } else {
                $uri = 'https://api.line.me/v2/bot/message/push';
                $data = [
                    'to' => $filter_case_response['customer']['custId'],
                    'messages' => $message_formated
                ];
                $header = [
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $platform_access_token['accessToken']
                ];
            }
            $send_line = Http::withHeaders($header)->post($uri, $data);
            if ($send_line->successful() && $send_line->status() === 200) {
                $res_send_line = $send_line->json();
                Log::channel('webhook_line_new')->info('ส่งข้อความตอบกลับไปยัง LINE สำเร็จ', [
                    'response' => json_encode($res_send_line, JSON_UNESCAPED_UNICODE),
                ]);
                foreach ($message_formated as $key => $message) {
                    // Default values
                    $contentType = $message['type'] ?? 'text';
                    $content = $message['text'] ?? '';

                    // ถ้าเป็น template menu → override
                    if (($message['type'] ?? '') === 'template' && ($message['template']['type'] ?? '') === 'buttons') {
                        $contentType = 'text';
                        $content = $message['template']['title'] . "\n"
                            . $message['template']['text'] . "\n";

                        foreach ($message['template']['actions'] as $act) {
                            $content .= $act['text'] . '.' . $act['label'] . "\n";
                        }
                        $content = trim($content); // ตัด \n ท้ายออก
                    }

                    ChatHistory::query()->create([
                        'custId' => $filter_case_response['customer']['custId'],
                        'content' => $content,
                        'contentType' => $contentType,
                        'sender' => json_encode($filter_case_response['bot']),
                        'conversationRef' => $filter_case_response['ac_id'] ?? null,
                        'line_message_id' => $res_send_line['sentMessages'][$key]['id'] ?? null,
                        'line_quote_token' => $res_send_line['sentMessages'][$key]['quoteToken'] ?? null,
                    ]);

                    $pusherService = new PusherService();
                    $pusherService->sendNotification($filter_case_response['customer']['custId']);
                }
            } else {
                Log::channel('webhook_line_new')->error('ส่งข้อความตอบกลับไปยัง LINE ไม่สำเร็จ', [
                    'response' => $send_line->json(),
                ]);
            }
        } catch (\Exception $e) {
            return [
                'status' => false,
                'message' => 'ไม่สามารถส่งข้อความตอบกลับได้: ' . $e->getMessage()
            ];
        }

        return [
            'status' => true,
            'message' => 'ตอบกลับสำเร็จ'
        ];
    }
}
