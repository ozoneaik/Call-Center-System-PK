<?php

namespace App\Http\Controllers\webhooks\new;

use App\Http\Controllers\Controller;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\Services\webhooks_new\FilterCase;
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
        try {
            $req = $request->all();
            Log::channel('webhook_line_new')->info(json_encode($req, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            $events = $req['events'];
            foreach ($events as $key => $event) {
                if ($event['type'] === 'message') {
                    Log::channel('webhook_line_new')->info('event index = ' . $key . 'เป็น message 💬');
                    $event_user_id = $event['source']['userId'];

                    // ตรวจสอบว่าผู้ใช้มีอยู่ในระบบหรือไม่
                    $cust_and_platform = $this->checkCustomer($event_user_id);
                    if ($cust_and_platform['customer'] && $cust_and_platform['platform']) {
                        $platform = $cust_and_platform['platform'];
                        $customer = $cust_and_platform['customer'];
                        Log::channel('webhook_line_new')->info('เจอผู้ใช้ในระบบ: ' . json_encode($customer, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                        Log::channel('webhook_line_new')->info('จาก platform: ' . json_encode($platform, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

                        // จัดรูปแบบข้อความก่อน
                        $message = $event['message'];
                        $formatted_message = $this->formatMessage($message, $platform['accessToken'],$event['replyToken']);
                        Log::channel('webhook_line_new')->info('ข้อความที่ได้รับ: ' . json_encode($formatted_message, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

                        // เข้าสุ่ filterCase
                        $filter_case = $this->filterCase->filterCase($customer, $formatted_message, $platform);
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

    private function formatMessage($message, $accessToken,$reply_token)
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
            $msg_formated['content'] =  'ที่อยู่ => '.$location_url;
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
        $header = 'Authorization: Bearer ' . $accessToken;
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
                $mediaPath = 'line-files/' . $mediaId . $extension;
                Storage::disk('public')->put($mediaPath, $mediaContent);
                $full_url = asset('storage/' . $mediaPath);
                return $full_url;
            } else {
                throw new \Exception('ไม่สามารถดึงสื่อได้ (response ไม่สำเร็จ)');
            }
        } catch (\Exception $e) {
            Log::channel('webhook_line_new')->error('ไม่สามารถดึง URL ของสื่อได้:❌ ' . $e->getMessage());
            $full_url = 'ไม่สามารถดึง URL ของสื่อได้:';
        }

        return $full_url;
    }
}
