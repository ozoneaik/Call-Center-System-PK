<?php

namespace App\Http\Controllers\webhooks\new;

use App\Http\Controllers\Controller;
use App\Models\BotMenu;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\Models\ChatHistory;
use App\Services\LazadaMessageService;
use App\Services\LazadaVideoService;
use App\Services\PusherService;
use App\Services\webhooks_new\FilterCase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Lazada\LazopClient;
use Lazada\LazopRequest;
use Illuminate\Support\Str;

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

    private function getUrlMedia($mediaUrl, $accessToken = null): ?string
    {
        try {
            if (!filter_var($mediaUrl, FILTER_VALIDATE_URL)) {
                Log::warning("Media URL ไม่ถูกต้อง: {$mediaUrl}");
                return null;
            }
            Log::info("กำลังดาวน์โหลดไฟล์มีเดียจาก URL: {$mediaUrl}");
            $response = Http::timeout(30)->get($mediaUrl);

            if ($response->successful()) {
                $mediaContent = $response->body();
                $contentType = $response->header('Content-Type');

                $urlParts = parse_url($mediaUrl);
                $pathInfo = pathinfo($urlParts['path'] ?? '');
                $originalFilename = $pathInfo['filename'] ?? 'media_' . time();
                $originalExtension = $pathInfo['extension'] ?? '';

                if (empty($originalExtension)) {
                    $originalExtension = ltrim($this->getExtensionFromContentType($contentType), '.');
                }

                // สร้าง path สำหรับเก็บใน S3
                $filename = $originalFilename . '_' . uniqid();
                if ($originalExtension) {
                    $filename .= '.' . $originalExtension;
                }
                $mediaPath = 'lazada/media/' . $filename;

                Log::info("กำลังอัปโหลดไฟล์ไปยัง S3: {$mediaPath}", [
                    'content_type' => $contentType,
                    'file_size' => strlen($mediaContent)
                ]);

                // อัปโหลดขึ้น S3 แบบ private โดยใช้ Flysystem ผ่าน Laravel Storage
                Storage::disk('s3')->put($mediaPath, $mediaContent, [
                    'visibility'  => 'private',
                    'ContentType' => $contentType ?: 'application/octet-stream',
                ]);

                $url = Storage::disk('s3')->url($mediaPath);

                Log::info("อัปโหลดไฟล์มีเดียสำเร็จ: {$url}");

                return $url;
            } else {
                Log::error("ไม่สามารถดาวน์โหลดไฟล์มีเดียได้", [
                    'media_url' => $mediaUrl,
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);
                return null;
            }
        } catch (\Exception $e) {
            Log::error("เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์มีเดีย: " . $e->getMessage(), [
                'media_url' => $mediaUrl,
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return null;
        }
    }

    private function getExtensionFromContentType(?string $contentType): string
    {
        if (!$contentType) {
            return '';
        }

        $extensions = [
            'image/jpeg' => '.jpg',
            'image/jpg' => '.jpg',
            'image/png' => '.png',
            'image/gif' => '.gif',
            'image/webp' => '.webp',
            'video/mp4' => '.mp4',
            'video/mpeg' => '.mpeg',
            'video/quicktime' => '.mov',
            'video/x-msvideo' => '.avi',
            'audio/mpeg' => '.mp3',
            'audio/wav' => '.wav',
            'audio/ogg' => '.ogg',
            'application/pdf' => '.pdf',
            'application/msword' => '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => '.docx',
        ];

        return $extensions[$contentType] ?? '';
    }

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
            $mediaUrl = $message['text'] ?? null;

            if ($mediaUrl && filter_var($mediaUrl, FILTER_VALIDATE_URL)) {
                Log::info("พบ URL มีเดีย: {$mediaUrl}");

                $s3Url = $this->getUrlMedia($mediaUrl);
                if ($s3Url) {
                    $result['content'] = $s3Url;
                    $result['original_media_url'] = $mediaUrl; // เก็บ URL เดิมไว้อ้างอิง
                    Log::info("บันทึกไฟล์มีเดียใน S3 สำเร็จ: {$s3Url}");
                } else {
                    $result['content'] = $mediaUrl;
                    $result['original_media_url'] = $mediaUrl;
                    Log::warning("ไม่สามารถบันทึกไฟล์มีเดียใน S3 ได้ ใช้ URL เดิม: {$mediaUrl}");
                }
            } else {
                $result['content'] = $mediaUrl ?: '';
                if ($mediaUrl) {
                    $result['original_media_url'] = $mediaUrl;
                }
                Log::warning('URL มีเดียไม่ถูกต้องหรือไม่มีข้อมูล', ['media_url' => $mediaUrl]);
            }
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

            if (
                !$platformToken ||
                empty($platformToken['laz_app_key']) ||
                empty($platformToken['laz_app_secret']) ||
                empty($platformToken['accessToken'])
            ) {
                throw new \Exception("ไม่พบ Lazada credentials ใน platform_access_token");
            }

            $messaged = $firstMsg;
            switch ($filter_case_response['type_send'] ?? '') {
                case 'menu':
                    $menuLines = BotMenu::query()
                        ->where('botTokenId', $platformToken['id'])
                        ->get()
                        ->map(fn($bot) => ($bot->menu_number ?? '-') . '. ' . ($bot->menuName ?? '-'))
                        ->implode("\n");
                    $messaged = "เลือกเมนู\n" . ($menuLines ?: '- ยังไม่มีเมนู -');
                    break;
                case 'queue':
                case 'menu_sended':
                case 'present':
                case 'normal':
                default:
                    break;
            }

            $request = new LazopRequest('/im/message/send', 'POST');
            $request->addApiParam('session_id',  $sessionId);
            $request->addApiParam('template_id', 1);
            $request->addApiParam('txt',         $messaged);

            Log::info('📤 LAZADA SEND PARAMS: ' . json_encode([
                'session_id'  => $sessionId,
                'template_id' => 1,
                'txt'         => $messaged,
            ], JSON_UNESCAPED_UNICODE));

            $client   = new LazopClient('https://api.lazada.co.th/rest', $platformToken['laz_app_key'], $platformToken['laz_app_secret']);
            $response = $client->execute($request, $platformToken['accessToken']);

            if (isset($response->code) && (string)$response->code !== '0') {
                Log::error('Lazada API Error: ' . json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                throw new \Exception("Lazada API Error: {$response->message} (Code: {$response->code})");
            }

            Log::info('✅ Lazada Message Sent Successfully: ' . json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            $respArr = json_decode(json_encode($response), true);
            $platformMsgId = $respArr['data']['message_id']
                ?? $respArr['message_id']
                ?? $respArr['result']['message_id']
                ?? null;

            $content     = $messaged;
            $contentType = 'text';

            try {
                $chatHistory = ChatHistory::query()->create([
                    'custId'            => $customer['custId'] ?? null,
                    'content'           => $content,
                    'contentType'       => $contentType,
                    'sender'            => json_encode($filter_case_response['bot'] ?? ['type' => 'bot', 'platform' => 'lazada'], JSON_UNESCAPED_UNICODE),
                    'conversationRef'   => $filter_case_response['ac_id'] ?? null,
                    'line_message_id'   => $platformMsgId,
                    'line_quote_token'  => $respArr['data']['quote_token'] ?? null,
                ]);

                $pusherService = new PusherService();
                $pusherService->sendNotification($customer['custId'] ?? '');

                Log::info('🗃️ ChatHistory created: ' . json_encode($chatHistory->only(['id', 'custId', 'conversationRef']), JSON_UNESCAPED_UNICODE));
            } catch (\Throwable $dbEx) {
                Log::error('❌ ChatHistory create failed: ' . $dbEx->getMessage());
            }

            return ['status' => true];
        } catch (\Exception $e) {
            Log::error('❌ ReplyPushMessage Error: ' . $e->getMessage());
            return [
                'status'  => false,
                'message' => 'ไม่สามารถส่งข้อความตอบกลับได้: ' . $e->getMessage(),
            ];
        }
    }
}
