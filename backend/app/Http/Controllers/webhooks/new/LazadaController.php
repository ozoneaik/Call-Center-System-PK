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

        $req = $request->all();
        if ($req['message_type'] === 2) {
            Log::info($this->start_log_line);
            Log::info('รับ webhook จาก Lazada');
            Log::info('รับ webhook สำเร็จเป็น event ส่งข้อความ');
            Log::info(json_encode($req, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        } else {
            return response()->json([
                'message' => 'รับ webhook สำเร็จแต่ไม่ใช่ event ส่งข้อความ'
            ]);
        }
        return;

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
                        Log::info('ข้อความที่ได้รับ (normalized): ' . json_encode($formatted_message, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

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

    private function normalizeLazadaToEvents(array $req): array
    {
        if (isset($req['message_type'], $req['data'])) {
            $messageType = (int)($req['message_type'] ?? 0);
            $data        = $req['data'] ?? [];
            $sellerId    = $req['seller_id'] ?? ($data['to_account_id'] ?? null);

            if ($messageType !== 2 || !isset($data['session_id'])) {
                return [$sellerId ?? 'lazada', [], $sellerId];
            }

            $contentStr  = $data['content'] ?? '{}';
            $contentData = json_decode($contentStr, true) ?: [];

            $rawType   = (int)($data['type'] ?? 1);
            $detected  = $this->detectImMessageType($rawType, $contentData);

            $lineStyleEvent = [
                'type'    => 'message',
                'message' => array_filter([
                    'type'       => $detected['type'],
                    'id'         => $data['message_id'] ?? null,
                    'text'       => $detected['text'],
                    'meta'       => $detected['meta'],
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

    private function detectImMessageType(int $rawType, array $contentData): array
    {
        $imgUrl   = $contentData['imgUrl'] ?? $contentData['img_url'] ?? null;
        $txt      = $contentData['txt'] ?? null;
        $videoId  = $contentData['videoId'] ?? $contentData['video_id'] ?? null;
        $videoKey = $contentData['videoKey'] ?? $contentData['video_key'] ?? null;
        $width    = $contentData['width'] ?? null;
        $height   = $contentData['height'] ?? null;

        if ($rawType === 6 || $videoId || $videoKey) {
            return [
                'type' => 'video',
                'text' => $videoId ?: ($videoKey ?: ''),
                'meta' => array_filter([
                    'videoId'  => $videoId,
                    'videoKey' => $videoKey,
                    'thumbnail' => $imgUrl,
                    'width'    => $width,
                    'height'   => $height,
                ], fn($v) => $v !== null),
            ];
        }
        if ($imgUrl) {
            return [
                'type' => 'image',
                'text' => $imgUrl,
                'meta' => array_filter([
                    'thumbnail' => $imgUrl,
                    'width'     => $width,
                    'height'    => $height,
                ], fn($v) => $v !== null),
            ];
        }
        return [
            'type' => 'text',
            'text' => $txt ?? 'ข้อความว่าง',
            'meta' => [],
        ];
    }

    private function formatMessage(array $message, ?string $replyToken): array
    {
        $msg_type = $message['type'] ?? 'text';

        $result = [
            'reply_token'           => $replyToken,
            'line_message_id'       => $message['id'] ?? null,
            'line_quote_token'      => null,
            'line_quoted_message_id' => null,
        ];

        if ($msg_type === 'text') {
            $result['contentType'] = 'text';
            $result['content']     = $message['text'] ?? 'ข้อความว่าง';
            return $result;
        }

        if (in_array($msg_type, ['image', 'video', 'audio', 'file'], true)) {
            $result['contentType'] = $msg_type;
            $meta = $message['meta'] ?? [];
            if ($msg_type === 'image') {
                $mediaUrl = $message['text'] ?? null;
                if ($mediaUrl && filter_var($mediaUrl, FILTER_VALIDATE_URL)) {
                    Log::info("พบ URL รูป: {$mediaUrl}");
                    $s3Url = $this->getUrlMedia($mediaUrl);
                    if ($s3Url) {
                        $result['content'] = $s3Url;
                        $result['original_media_url'] = $mediaUrl;
                        Log::info("อัปโหลดรูปขึ้น S3 สำเร็จ: {$s3Url}");
                    } else {
                        $result['content'] = $mediaUrl;
                        $result['original_media_url'] = $mediaUrl;
                        Log::warning("อัปโหลดรูปขึ้น S3 ไม่สำเร็จ ใช้ URL เดิม");
                    }
                } else {
                    $result['content'] = $mediaUrl ?: '';
                    Log::warning('URL รูปไม่ถูกต้องหรือไม่มีข้อมูล', ['media_url' => $mediaUrl]);
                }
                $result['media_meta'] = $meta;
                return $result;
            }

            if ($msg_type === 'video') {
                $meta    = $message['meta'] ?? [];
                $videoId = $meta['videoId']  ?? null;
                $videoKey = $meta['videoKey'] ?? null;
                $thumb   = $meta['thumbnail'] ?? null;
                $thumbS3 = null;
                if ($thumb && filter_var($thumb, FILTER_VALIDATE_URL)) {
                    $thumbS3 = $this->getUrlMedia($thumb);
                }

                $platformToken = PlatformAccessTokens::query()->where('platform', 'lazada')->first();
                $videoS3 = null;
                if ($platformToken) {
                    $videoS3 = $this->resolveImVideoToS3(
                        ['videoId' => $videoId, 'videoKey' => $videoKey],
                        $platformToken->toArray()
                    );
                }

                $result['content']    = $videoS3['url'] ?? ($videoId ?: ($videoKey ?: ''));
                $result['contentType'] = 'video';
                $result['media_meta'] = array_filter([
                    'videoId'   => $videoId,
                    'videoKey'  => $videoKey,
                    'thumbnail' => $thumbS3 ?: $thumb,
                    's3_size'   => $videoS3['bytes'] ?? null,
                    's3_ct'     => $videoS3['content_type'] ?? null,
                ], fn($v) => $v !== null);

                return $result;
            }

            $mediaUrl = $message['text'] ?? null;
            if ($mediaUrl && filter_var($mediaUrl, FILTER_VALIDATE_URL)) {
                $s3Url = $this->getUrlMedia($mediaUrl);
                $result['content'] = $s3Url ?: $mediaUrl;
                $result['original_media_url'] = $mediaUrl;
            } else {
                $result['content'] = $mediaUrl ?: '';
            }
            $result['media_meta'] = $meta;

            return $result;
        }

        $result['contentType'] = 'text';
        $result['content']     = 'ไม่รู้จักประเภทข้อความ';
        return $result;
    }

    private function resolveImVideoToS3(array $meta, array $platformToken): ?array
    {
        try {
            $videoId  = $meta['videoId']  ?? null;
            $videoKey = $meta['videoKey'] ?? null;

            if (!$videoId && !$videoKey) {
                Log::warning('resolveImVideoToS3: missing videoId/videoKey');
                return null;
            }

            $playUrl = $this->getImVideoPlayUrl($videoId, $videoKey, $platformToken);
            if (!$playUrl || !filter_var($playUrl, FILTER_VALIDATE_URL)) {
                Log::warning('resolveImVideoToS3: cannot obtain play URL', ['videoId' => $videoId, 'videoKey' => $videoKey]);
                return null;
            }
            $baseName = $videoId ? ('im_' . $videoId) : ('im_' . substr($videoKey, 0, 12));
            $saved = $this->downloadToS3($playUrl, 'lazada/video', $baseName);
            if ($saved) {
                return $saved; // ['url'=>..., 'bytes'=>..., 'content_type'=>...]
            }
        } catch (\Throwable $e) {
            Log::error('resolveImVideoToS3 error: ' . $e->getMessage(), ['file' => $e->getFile(), 'line' => $e->getLine()]);
        }
        return null;
    }

    private function getImVideoPlayUrl(?string $videoId, ?string $videoKey, array $platformToken): ?string
    {
        try {
            $endpoint = 'https://api.lazada.co.th/rest';
            $path = '/im/message/video/play/get';

            $client  = new LazopClient($endpoint, $platformToken['laz_app_key'], $platformToken['laz_app_secret']);
            $request = new LazopRequest($path, 'GET');

            if ($videoId) {
                $request->addApiParam('video_id', $videoId);
            }
            if ($videoKey) {
                $request->addApiParam('video_key', $videoKey);
            }

            // $request->addApiParam('session_id', $sessionId ?? '');
            // $request->addApiParam('message_id', $messageId ?? '');
            $resp = $client->execute($request, $platformToken['accessToken']);

            $arr = json_decode(json_encode($resp), true);
            $playUrl = $arr['data']['play_url']
                ?? $arr['data']['url']
                ?? $arr['play_url']
                ?? $arr['url']
                ?? null;

            if (!$playUrl) {
                Log::error('IM video play url not found in response', ['resp' => $arr]);
                return null;
            }

            Log::info('IM video play url obtained', ['url' => $playUrl]);
            return $playUrl;
        } catch (\Throwable $e) {
            Log::error('getImVideoPlayUrl error: ' . $e->getMessage(), ['file' => $e->getFile(), 'line' => $e->getLine()]);
            return null;
        }
    }

    private function downloadToS3(string $url, string $dir = 'lazada/video', ?string $baseName = null): ?array
    {
        try {
            $res = Http::timeout(120)->withHeaders([
                'User-Agent' => 'Lazada-IM-VideoFetcher/1.0',
            ])->get($url);

            if (!$res->successful()) {
                Log::error('downloadToS3: HTTP failed', ['status' => $res->status(), 'body' => substr($res->body(), 0, 500)]);
                return null;
            }

            $bytes       = $res->body();
            $contentType = $res->header('Content-Type') ?: 'video/mp4';

            $ext = $this->getExtensionFromContentType($contentType) ?: '.mp4';
            $baseName = $baseName ?: ('imvid_' . uniqid());
            $filename = $baseName . '_' . uniqid('', true) . $ext;
            $path     = rtrim($dir, '/') . '/' . $filename;

            Storage::disk('s3')->put($path, $bytes, [
                'visibility'  => 'private',
                'ContentType' => $contentType,
            ]);

            $s3Url = Storage::disk('s3')->url($path);

            Log::info('downloadToS3: uploaded', ['path' => $path, 'ct' => $contentType, 'len' => strlen($bytes)]);
            return ['url' => $s3Url, 'bytes' => strlen($bytes), 'content_type' => $contentType];
        } catch (\Throwable $e) {
            Log::error('downloadToS3 error: ' . $e->getMessage(), ['file' => $e->getFile(), 'line' => $e->getLine()]);
            return null;
        }
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
                $contentType  = $response->header('Content-Type');

                $urlParts          = parse_url($mediaUrl);
                $pathInfo          = pathinfo($urlParts['path'] ?? '');
                $originalFilename  = $pathInfo['filename'] ?? 'media_' . time();
                $originalExtension = $pathInfo['extension'] ?? '';

                if (empty($originalExtension)) {
                    $originalExtension = ltrim($this->getExtensionFromContentType($contentType), '.');
                }

                $filename = $originalFilename . '_' . uniqid();
                if ($originalExtension) {
                    $filename .= '.' . $originalExtension;
                }
                $mediaPath = 'lazada/media/' . $filename;

                Log::info("กำลังอัปโหลดไฟล์ไปยัง S3: {$mediaPath}", [
                    'content_type' => $contentType,
                    'file_size'    => strlen($mediaContent)
                ]);

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
                    'status'    => $response->status(),
                    'response'  => $response->body()
                ]);
                return null;
            }
        } catch (\Exception $e) {
            Log::error("เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์มีเดีย: " . $e->getMessage(), [
                'media_url' => $mediaUrl,
                'file'      => $e->getFile(),
                'line'      => $e->getLine()
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
            'image/jpg'  => '.jpg',
            'image/png'  => '.png',
            'image/gif'  => '.gif',
            'image/webp' => '.webp',
            'video/mp4'  => '.mp4',
            'video/mpeg' => '.mpeg',
            'video/quicktime' => '.mov',
            'video/x-msvideo' => '.avi',
            'audio/mpeg' => '.mp3',
            'audio/wav'  => '.wav',
            'audio/ogg'  => '.ogg',
            'application/pdf'  => '.pdf',
            'application/msword' => '.doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => '.docx',
        ];
        return $extensions[$contentType] ?? '';
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
                case 'evaluation':
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

            Log::info('✅Lazada Message Sent Successfully: ' . json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

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
