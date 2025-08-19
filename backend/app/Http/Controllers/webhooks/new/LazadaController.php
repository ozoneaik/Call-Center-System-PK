<?php

namespace App\Http\Controllers\webhooks\new;

use App\Http\Controllers\Controller;
use App\Models\BotMenu;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\Models\ChatHistory;
use App\Services\PusherService;
use App\Services\webhooks_new\FilterCase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Lazada\LazopClient;
use Lazada\LazopRequest;

class LazadaController extends Controller
{
    protected string $start_log_line = '--------------------------------------------------🌞 เริ่มรับ webhook--------------------------------------------------';
    protected string $end_log_line   = '---------------------------------------------------🌚 สิ้นสุดรับ webhook---------------------------------------------------';

    protected FilterCase $filterCase;

    public function __construct(FilterCase $filterCase)
    {
        $this->filterCase = $filterCase;
    }

    public function webhook(Request $request)
    {
        Log::info($this->start_log_line);
        Log::info('รับ webhook จาก Lazada');
        Log::info('request: ' . json_encode($request->all(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        $req = $request->all();

        if (isset($req['data']['from_account_type']) && (string)$req['data']['from_account_type'] === '1') {
            try {
                [$destination, $events, $sellerId] = $this->normalizeLazadaToEvents($req);

                Log::info(json_encode([
                    'destination' => $destination,
                    'events'      => $events,
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

                foreach ($events as $idx => $event) {
                    if (($event['type'] ?? '') === 'message') {
                        Log::info("event index = {$idx} เป็น message 💬");

                        $sessionId = $event['source']['userId'] ?? null;
                        if (!$sessionId) {
                            Log::warning('ไม่มี session_id (userId) ใน event: ข้าม');
                            continue;
                        }

                        $cust_and_platform = $this->checkCustomer($sessionId);
                        if (!($cust_and_platform['customer'] && $cust_and_platform['platform'])) {
                            Log::warning('ไม่มี token ของ Lazada หรือไม่พบ customer', [
                                'session_id' => $sessionId,
                                'seller_id'  => $sellerId,
                            ]);
                            continue;
                        }

                        $platform = $cust_and_platform['platform'];
                        $customer = $cust_and_platform['customer'];

                        Log::info('เจอผู้ใช้ในระบบ: ' . json_encode($customer, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                        Log::info('จาก platform: ' . json_encode($platform, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

                        $formatted_message = $this->formatMessage($event['message'] ?? [], $event['replyToken'] ?? null);
                        Log::info('ข้อความที่ได้รับ: ' . json_encode($formatted_message, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

                        $replyToken = $formatted_message['reply_token'] ?? '';
                        if ($replyToken) {
                            $cacheKey = "lzd:replied:$replyToken";
                            if (!Cache::add($cacheKey, 1, 180)) {
                                Log::info('ข้ามการตอบ: เคยตอบข้อความนี้แล้ว', ['reply_token' => $replyToken]);
                                continue;
                            }
                        }

                        $filter_case = $this->filterCase->filterCase($customer, $formatted_message, $platform);
                        $send_lazada = $this->ReplyPushMessage($filter_case);
                        if (!$send_lazada['status']) {
                            throw new \Exception($send_lazada['message']);
                        }
                    } else {
                        Log::error("event index = {$idx} ไม่ใช่ประเภท message");
                    }
                }
            } catch (\Exception $e) {
                $msg_error  = 'เกิดข้อผิดพลาดในการตอบกลับ webhook: ';
                $msg_error .= $e->getMessage() . ' | ไฟล์: ' . $e->getFile() . ' | บรรทัด: ' . $e->getLine();
                Log::error('❌ ' . $msg_error);
            }

            Log::info($this->end_log_line);
            return response()->json(['message' => 'ตอบกลับ webhook สําเร็จ']);
        } else {
            Log::error('ไม่พบ data หรือ from_account_type != 1');
            return;
        }
    }

    /**
     * แปลง Lazada Push (message_type=2) → events(สไตล์ที่อยาก log)
     */
    private function normalizeLazadaToEvents(array $req): array
    {
        if (isset($req['message_type'], $req['data'])) {
            $messageType = (int)($req['message_type'] ?? 0);
            $data        = $req['data'] ?? [];
            $sellerId    = $req['seller_id'] ?? ($data['to_account_id'] ?? null);

            if ($messageType !== 2 || !isset($data['session_id'])) {
                return [$sellerId ?? 'lazada', [], $sellerId];
            }

            $contentData = json_decode($data['content'] ?? '{}', true) ?: [];
            $msgType = 'text';
            $text    = $contentData['txt'] ?? null;

            $rawType = (int)($data['type'] ?? 1); // 1=text, 2=image, 6=video
            if (!empty($contentData['imgUrl']) || !empty($contentData['img_url']) || $rawType === 2) {
                $msgType = 'image';
                $text = $contentData['imgUrl'] ?? $contentData['img_url'] ?? null;
            } elseif (!empty($contentData['videoId']) || !empty($contentData['video_id']) || $rawType === 6) {
                $msgType = 'video';
                $text = $contentData['videoId'] ?? $contentData['video_id'] ?? null;
            }

            $lineStyleEvent = [
                'type' => 'message',
                'message' => array_filter([
                    'type' => $msgType,
                    'id'   => $data['message_id'] ?? null,
                    'text' => $text,
                ], fn($v) => $v !== null),
                'webhookEventId'  => $data['message_id'] ?? null,
                'deliveryContext' => ['isRedelivery' => false],
                'timestamp'       => (int)($data['send_time'] ?? round(microtime(true) * 1000)),
                'source'          => [
                    'type'   => ((string)($data['from_account_type'] ?? '1')) === '1' ? 'user' : 'bot',
                    'userId' => $data['session_id'] ?? null,
                ],
                'replyToken' => $data['message_id'] ?? null,
                'mode'       => 'active',
                'raw'        => $data,
            ];

            return [$sellerId ?? 'lazada', [$lineStyleEvent], $sellerId];
        }

        if (isset($req['destination'], $req['events'])) {
            $sellerId = $req['destination'] ?? null;
            return [$req['destination'], $req['events'], $sellerId];
        }

        return ['lazada', [], null];
    }

    /**
     * หา/สร้าง customer สำหรับ Lazada โดยใช้ session_id เป็น custId
     */
    private function checkCustomer(string $sessionId): array
    {
        $customer = Customers::query()->where('custId', $sessionId)->first();
        $platform = PlatformAccessTokens::query()->where('platform', 'lazada')->first();

        if ($customer && $platform) {
            return ['customer' => $customer, 'platform' => $platform];
        }

        if (!$customer && $platform) {
            $customer = Customers::query()->create([
                'custId'      => $sessionId,
                'custName'    => 'ลูกค้า',
                'avatar'      => null,
                'description' => 'ลูกค้าจาก Lazada (' . ($platform['description'] ?? '') . ')',
                'platformRef' => $platform['id'],
            ]);
            return ['customer' => $customer, 'platform' => $platform];
        }

        return ['customer' => null, 'platform' => null];
    }

    /**
     * แปลง message (ที่ normalize แล้ว) → โครงกลางให้ FilterCase ใช้
     */
    private function formatMessage(array $message, ?string $replyToken): array
    {
        $msg_type = $message['type'] ?? 'text';
        $result = [
            'reply_token' => $replyToken,
            'line_message_id' => $message['id'] ?? null,
            'line_quote_token' => null,
            'line_quoted_message_id' => null,
        ];

        if ($msg_type === 'text') {
            $result['contentType'] = 'text';
            $result['content']     = $message['text'] ?? 'ข้อความว่าง';
        } elseif (in_array($msg_type, ['image', 'video', 'audio', 'file'], true)) {
            $result['contentType'] = $msg_type;
            $result['content']     = $message['text'] ?? ''; // เก็บ url/video_id ไว้
        } else {
            $result['contentType'] = 'text';
            $result['content']     = 'ไม่รู้จักประเภทข้อความ';
        }
        return $result;
    }

    public function ReplyPushMessage($filter_case_response)
    {
        try {
            $filter_case_response = $filter_case_response['case'] ?? $filter_case_response;

            Log::info('🤖🤖🤖 RESPONSE');
            Log::info(json_encode($filter_case_response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            if (empty($filter_case_response['send_to_cust'])) {
                return ['status' => true, 'message' => 'ตอบกลับสำเร็จ'];
            }

            $platformToken = $filter_case_response['platform_access_token'] ?? null;
            $customer      = $filter_case_response['customer'] ?? null;
            $sessionId     = $customer['custId'] ?? null;
            $messages      = $filter_case_response['messages'] ?? [];

            $firstMsg = $messages[0]['content'] ?? '';

            $message_format = [
                'txt'         => $firstMsg,
                'template_id' => 1,
                'session_id'  => $sessionId,
            ];

            Log::info('message_format: ' . json_encode($message_format, JSON_UNESCAPED_UNICODE));

            if (!$platformToken || empty($platformToken['laz_app_key']) || empty($platformToken['laz_app_secret']) || empty($platformToken['accessToken'])) {
                throw new \Exception("ไม่พบ Lazada credentials ใน platform_access_token");
            }

            $client = new LazopClient(
                'https://api.lazada.co.th/rest',
                $platformToken['laz_app_key'],
                $platformToken['laz_app_secret']
            );

            $request = new LazopRequest('/im/message/send', 'POST');
            $request->addApiParam('session_id', $message_format['session_id']);
            $request->addApiParam('template_id', $message_format['template_id']);
            $request->addApiParam('txt', $message_format['txt']);

            $response = $client->execute($request, $platformToken['accessToken']);

            if (isset($response->code) && (string)$response->code !== '0') {
                Log::error('Lazada API Error: ' . json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                throw new \Exception("Lazada API Error: {$response->message} (Code: {$response->code})");
            }

            Log::info('✅ Lazada Message Sent Successfully: ' . json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            return ['status' => true];
        } catch (\Exception $e) {
            return [
                'status'  => false,
                'message' => 'ไม่สามารถส่งข้อความตอบกลับได้: ' . $e->getMessage(),
            ];
        }
    }
}