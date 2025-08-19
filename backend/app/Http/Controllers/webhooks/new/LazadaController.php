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

        try {
            $req = $request->all();

            [$destination, $events, $sellerId] = $this->normalizeLazadaToEvents($req);

            Log::info(json_encode([
                'destination' => $destination,
                'events'      => $events,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            foreach ($events as $idx => $event) {
                if (($event['type'] ?? '') === 'message') {
                    Log::info('event index = ' . $idx . 'เป็น message 💬');

                    // ในที่นี้ userId = session_id ของ Lazada IM
                    $sessionId = $event['source']['userId'] ?? null;
                    if (!$sessionId) {
                        Log::warning('ไม่มี session_id (userId) ใน event: ข้าม');
                        continue;
                    }

                    // หา/สร้าง customer + ดึง platform lazada
                    $cust_and_platform = $this->checkCustomer($sessionId);
                    if (!($cust_and_platform['customer'] && $cust_and_platform['platform'])) {
                        Log::warning('ไม่มี token ของ Lazada หรือไม่พบ customer: ข้ามการประมวลผล', [
                            'session_id' => $sessionId,
                            'seller_id'  => $sellerId,
                        ]);
                        continue;
                    }
                    $platform = $cust_and_platform['platform'];
                    $customer = $cust_and_platform['customer'];

                    Log::info('เจอผู้ใช้ในระบบ: ' . json_encode($customer, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                    Log::info('จาก platform: ' . json_encode($platform, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

                    // สร้าง message แบบกลางให้ FilterCase ใช้
                    $formatted_message = $this->formatMessage($event['message'] ?? [], $event['replyToken'] ?? null);

                    Log::info('ข้อความที่ได้รับ: ' . json_encode($formatted_message, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

                    // ---- กันตอบซ้ำในกรณี redelivery/loop (idempotency) ----
                    $replyToken = $formatted_message['reply_token'] ?? '';
                    if ($replyToken) {
                        $cacheKey = "lzd:replied:$replyToken";
                        if (!Cache::add($cacheKey, 1, 180)) {
                            Log::info('ข้ามการตอบ: เคยตอบข้อความนี้แล้ว', ['reply_token' => $replyToken]);
                            continue;
                        }
                    }
                    // -----------------------------------------------------

                    // ให้ FilterCase ตัดสินใจ
                    $filter_case = $this->filterCase->filterCase($customer, $formatted_message, $platform);

                    // ส่งกลับผู้ใช้ผ่าน Lazada IM
                    $send_lazada = $this->ReplyPushMessage($filter_case);
                    if (!$send_lazada['status']) {
                        throw new \Exception($send_lazada['message']);
                    }
                } else {
                    Log::error('event index = ' . $idx . 'ไม่ใช่ประเภท message');
                }
            }
        } catch (\Exception $e) {
            $msg_error  = 'เกิดข้อผิดพลาดในการตอบกลับ webhook: ';
            $msg_error .= $e->getMessage() . ' | ไฟล์ที่: ' . $e->getFile() . ' | บรรทัดที่: ' . $e->getLine();
            Log::error('เกิดข้อผิดพลาด ❌ : ' . $msg_error);
        }

        Log::info($this->end_log_line);
        return response()->json(['message' => 'ตอบกลับ webhook สําเร็จ']);
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

    /**
     * ดึง/อัปโหลดไฟล์ไป S3 (ใช้ได้กรณีมี URL ตรง)
     */
    private function getUrlMedia($mediaRef, $accessToken = null, $expected = 'auto')
    {
        try {
            if (!$mediaRef || !is_string($mediaRef)) {
                throw new \Exception('ไม่มีอ้างอิงไฟล์สื่อที่ถูกต้อง');
            }
            $response = Http::get($mediaRef);
            if (!$response->successful()) {
                throw new \Exception('ดาวน์โหลดสื่อจาก URL ไม่สำเร็จ');
            }
            $mediaContent = $response->body();
            $contentType  = $response->header('Content-Type');

            $ext = match ($contentType) {
                'image/jpeg' => '.jpg',
                'image/png'  => '.png',
                'image/gif'  => '.gif',
                'image/webp' => '.webp',
                'video/mp4'  => '.mp4',
                'video/webm' => '.webm',
                'video/ogg'  => '.ogg',
                'video/avi'  => '.avi',
                'video/quicktime' => '.mov',
                'audio/x-m4a', 'audio/m4a' => '.m4a',
                'audio/mpeg'  => '.mp3',
                'application/pdf'  => '.pdf',
                'application/zip'  => '.zip',
                'application/msword' => '.doc',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => '.docx',
                'application/vnd.ms-excel' => '.xls',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => '.xlsx',
                'application/vnd.ms-powerpoint' => '.ppt',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation' => '.pptx',
                default => match ($expected) {
                    'image' => '.jpg',
                    'video' => '.mp4',
                    'audio' => '.m4a',
                    'file'  => '.bin',
                    default => '.bin',
                },
            };

            $basename = 'lazada/' . uniqid('lzd_', true) . $ext;
            Storage::disk('s3')->put($basename, $mediaContent, [
                'visibility'  => 'private',
                'ContentType' => $contentType,
            ]);
            return Storage::disk('s3')->url($basename);
        } catch (\Exception $e) {
            Log::error('❌ ไม่สามารถดึง/อัปโหลด URL ของสื่อได้: ' . $e->getMessage(), [
                'mediaRef' => $mediaRef,
                'expected' => $expected,
            ]);
            return 'ไม่สามารถดึง URL ของสื่อได้';
        }
    }

    /**
     * ส่งข้อความกลับผ่าน Lazada IM (/im/message/send)
     * ใช้ session_id = customer.custId
     * - ใช้ POST (form) เท่านั้น
     * - มี retry/backoff เมื่อเจอ ApiCallLimit/429
     * - Throttle ต่อ session ด้วย Cache::lock
     */
    public function ReplyPushMessage($filter_case_response)
    {
        try {
            $filter_case_response = $filter_case_response['case'] ?? $filter_case_response;

            Log::info('🤖🤖🤖🤖🤖🤖🤖');
            Log::info(json_encode($filter_case_response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            Log::info('🤖🤖🤖🤖🤖🤖🤖');

            if (!($filter_case_response['send_to_cust'] ?? false)) {
                return ['status' => true, 'message' => 'ไม่ต้องส่งข้อความกลับ'];
            }

            $platformToken = $filter_case_response['platform_access_token'] ?? null;
            $customer      = $filter_case_response['customer'] ?? null;
            $sessionId     = $customer['custId'] ?? null;

            if (!$platformToken || !$sessionId) {
                throw new \Exception('ขาด platform token หรือ session_id');
            }

            $lock = Cache::lock("lzd:send:$sessionId", 2);
            if (!$lock->get()) {
                Log::warning('ข้ามการส่ง: throttle per session กำลังทำงาน', ['session' => $sessionId]);
                return ['status' => true, 'message' => 'throttled'];
            }

            try {
                $apiUrl  = rtrim(env('LAZADA_API_URL', 'https://api.lazada.co.th/rest'), '/');
                $apiPath = '/im/message/send';

                foreach (($filter_case_response['messages'] ?? []) as $msg) {
                    $contentType = $msg['contentType'] ?? 'text';
                    $content     = (string)($msg['content'] ?? '');

                    $params = ['session_id' => $sessionId];

                    if ($contentType === 'image') {
                        $params['template_id'] = '3';
                        $params['img_url']     = $content;  // URL รูป
                    } elseif ($contentType === 'video') {
                        $params['template_id'] = '6';
                        $params['video_id']    = $content;  // video_id
                    } else {
                        $params['template_id'] = '1';
                        $params['text']        = $content;  // ข้อความ
                    }

                    // ใส่ common + sign
                    $signed = $this->buildAndSignRequest($apiPath, $params, $platformToken);

                    // POST + Retry เมื่อเจอ ApiCallLimit/429
                    $result = $this->postLazadaWithRetry($apiUrl . $apiPath, $signed, 3);

                    if (!($result['ok'] ?? false)) {
                        Log::error('ส่งข้อความไป Lazada IM ไม่สำเร็จ', ['response' => $result['json'] ?? null]);
                        throw new \Exception('Lazada IM ส่งข้อความล้มเหลว');
                    }

                    ChatHistory::query()->create([
                        'custId'          => $sessionId,
                        'content'         => $content,
                        'contentType'     => $contentType,
                        'sender'          => json_encode($filter_case_response['bot'] ?? ['type' => 'bot']),
                        'conversationRef' => $filter_case_response['ac_id'] ?? null,
                        'line_message_id' => $result['json']['data']['message_id'] ?? null,
                        'line_quote_token' => null,
                    ]);

                    (new PusherService())->sendNotification($sessionId);
                    usleep(1_000_000); // 1 วินาที
                }
            } finally {
                optional($lock)->release();
            }
        } catch (\Exception $e) {
            return [
                'status'  => false,
                'message' => 'ไม่สามารถส่งข้อความตอบกลับได้: ' . $e->getMessage(),
            ];
        }

        return ['status' => true, 'message' => 'ตอบกลับสำเร็จ'];
    }

    /**
     * POST ไป Lazada พร้อม retry/backoff เมื่อโดน ApiCallLimit/429
     */
    private function postLazadaWithRetry(string $url, array $params, int $maxRetries = 3): array
    {
        $attempt = 0;
        $last    = null;

        do {
            $attempt++;
            $resp = Http::asForm()->post($url, $params);
            $json = $resp->json();
            $last = ['resp' => $resp, 'json' => $json];

            if ($resp->successful() && ($json['code'] ?? null) === '0') {
                return ['ok' => true, 'json' => $json];
            }

            $code    = $json['code'] ?? null;
            $is429   = $resp->status() === 429;
            $isLimit = ($code === 'ApiCallLimit' || $code === '429' || $code === 'TooManyRequests');

            if ($is429 || $isLimit) {
                // Lazada มักบอก "ban will last 1 seconds" → ถอย 1.1 วินาที
                usleep(1_100_000);
                continue;
            }

            // ไม่ใช่เคสที่ควร retry
            break;
        } while ($attempt < $maxRetries);

        return ['ok' => false, 'json' => $last['json'] ?? null];
    }

    private function buildAndSignRequest(string $apiPath, array $customParams, $token): array
    {
        $common = [
            'app_key'      => $token['laz_app_key'] ?? env('LAZADA_APP_KEY'),
            'sign_method'  => 'sha256',
            'timestamp'    => (int) round(microtime(true) * 1000),
            'access_token' => $token['accessToken'] ?? env('LAZADA_ACCESS_TOKEN'),
        ];
        $params = array_merge($common, $customParams);
        ksort($params);

        $toSign = $apiPath;
        foreach ($params as $k => $v) {
            if (is_string($v) || is_numeric($v)) {
                $toSign .= $k . $v;
            }
        }

        $secret         = $token['laz_app_secret'] ?? env('LAZADA_APP_SECRET');
        $params['sign'] = strtoupper(hash_hmac('sha256', $toSign, $secret));
        return $params;
    }
}
