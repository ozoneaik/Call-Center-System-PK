<?php

namespace App\Http\Controllers\webhooks\new;

use App\Http\Controllers\Controller;
use App\Models\BotMenu;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\Services\PusherService;
use App\Services\webhooks_new\FilterCase;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NewShopeeController extends Controller
{
    //
    protected string $start_log_line = '--------------------------------------------------🌞 เริ่มรับ webhook--------------------------------------------------';
    protected string $end_log_line   = '---------------------------------------------------🌚 สิ้นสุดรับ webhook---------------------------------------------------';
    protected FilterCase $filterCase;
    public function __construct(FilterCase $filterCase)
    {
        $this->filterCase = $filterCase;
    }
    public function webhooks(Request $request)
    {
        try {
            $raw  = $request->getContent();
            $payload = json_decode($raw, true);

            //ตรวจสอบร้านค้าจาก shopee_shop_id 
            $shopIdTop = $payload['shop_id'] ?? null;
            $exists = DB::table('platform_access_tokens')
                ->where('platform', 'shopee')
                ->where('shopee_shop_id', $shopIdTop)
                ->exists();

            if (!$exists) {
                Log::warning("Shopee webhook: ข้าม shop_id {$shopIdTop} (ไม่พบใน platform_access_tokens)");
                return response()->json(['message' => "skip shop_id {$shopIdTop}"], 200);
            }

            Log::info(json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            $msgId = $payload['msg_id'] ?? null;
            $code = $payload['code'] ?? null;
            $data = $payload['data'] ?? [];
            $c = $data['content'] ?? [];
            $messageId = $c['message_id'] ?? null;
            $messageType = $c['message_type'] ?? null;
            $conversationId = $c['conversation_id'] ?? null;
            $fromId = $c['from_id'] ?? null;
            $fromName = $c['from_user_name'] ?? null;
            $textPayload = $c['content']['text'] ?? null;
            $shopIdTop = $payload['shop_id'] ?? null;

            $allowedTypes = ['text', 'image', 'video', 'item', 'item_list'];
            if ($messageType === 'bundle_message') {
                Log::info("Shopee webhook: ข้าม bundle_message", ['message_id' => $messageId]);
                return response()->json(['message' => 'skip bundle_message'], 200);
            }
            if ($code === 10 && ($data['type'] ?? null) === 'message' && in_array($messageType, $allowedTypes, true)) {
                $DuplicateId = ChatHistory::query()
                    ->where('line_message_id', $messageId)
                    ->first();
                if ($DuplicateId) {
                    Log::info('Shopee webhook duplicated', ['message_id' => $messageId]);
                    return response()->json(['message' => 'duplicate webhook'], 200);
                }
                Log::info($this->start_log_line);
                Log::info('รับ webhook จาก Shopee');
                Log::info('รับ webhook สำเร็จเป็น event ส่งข้อความ');
                $check = $this->check_customer_and_get_platform(
                    $conversationId,
                    $fromId,
                    $shopIdTop,
                    $fromName
                );
                $customer = $check['customer'];
                $platform = $check['platform'];
                $message_req = [
                    'message_id'   => $messageId,
                    'message_type' => $messageType,
                    'content'      => $c['content'] ?? [],
                ];
                $message_formatted = $this->format_message($message_req, $platform);

                $filter_case = $this->filterCase->filterCase($customer, $message_formatted, $platform);
                Log::info(json_encode($filter_case, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                $push_result = $this->pushReplyMessage($filter_case, $messageId);
            } else {
                Log::info('ไม่เข้า');
            }
        } catch (\Throwable $e) {
            Log::error('Shopee webhook error ❌', [
                'error' => $e->getMessage(),
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
            ]);
        }
        Log::info($this->end_log_line);
        return response()->json(['message' => 'ok'], 200);
    }

    private function check_customer_and_get_platform(
        string $conversationId,
        ?int $buyerId = null,
        ?int $shopId = null,
        ?string $fromUserName = null
    ): array {
        $shopeePlatform = PlatformAccessTokens::query()
            ->where('platform', 'shopee')
            ->when($shopId, fn($q) => $q->where('shopee_shop_id', $shopId))
            ->first();

        if (!$shopeePlatform) {
            return ['platform' => null, 'customer' => null];
        }

        $custKey = $buyerId ? (string) $buyerId : "SHP-CONV-" . strtoupper(substr(md5($conversationId), 0, 8));
        $customer = Customers::query()->where('custId', $custKey)->first();
        if ($customer) {
            return [
                'platform' => $shopeePlatform,
                'customer' => $customer,
            ];
        }

        $custName = $fromUserName ?: "Shopee-" . $custKey;
        $newCustomer = Customers::query()->create([
            'custId'       => $custKey,
            'custName'     => $custName,
            'description'  => "ติดต่อมาจาก shopee platform",
            'avatar'       => null,
            'platformRef'  => $shopeePlatform->id,
        ]);

        return [
            'platform' => $shopeePlatform,
            'customer' => $newCustomer,
        ];
    }

    private function format_message(array $message_req, $platform)
    {
        $msg_formatted = [
            'content'          => null,
            'contentType'      => 'text',
            'reply_token'      => 'ไม่มีไรหรอก',
            'line_quote_token' => $message_req['message_id'] ?? null,
            'line_message_id'  => $message_req['message_id'] ?? null,
        ];
        $type = $message_req['message_type'] ?? null;
        $ct   = $message_req['content'] ?? [];

        switch ($type) {
            case 'text':
                $msg_formatted['content']     = $ct['text'] ?? '';
                $msg_formatted['contentType'] = 'text';
                break;
            case 'image':
                $msg_formatted['content']     = $ct['url'] ?? '';
                $msg_formatted['contentType'] = 'image';
                break;
            case 'video':
                $msg_formatted['content']     = $ct['video_url'] ?? ($ct['url'] ?? '');
                $msg_formatted['contentType'] = 'video';
                break;
            case 'item_list':
                $product_list = $ct['chat_product_infos'];
                $message_real = '';
                foreach ($product_list as $key => $product) {
                    $imageUrl = "https://cf.shopee.co.th/file/" . $product['thumb_url'];
                    $name     = $product['name'] ?? 'ไม่ทราบชื่อสินค้า';
                    $minPrice = $product['min_price'] ?? 0;
                    $maxPrice = $product['max_price'] ?? 0;
                    $url      = "https://shopee.co.th/product/" . $product['shop_id'] . "/" . $product['item_id'];

                    $message_real .= "รายการที่ " . ($key + 1) . "\n";
                    $message_real .= "🖼️ รูป: {$imageUrl}\n";
                    $message_real .= "{$name}\n";
                    $message_real .= "ราคา : {$minPrice} - {$maxPrice} บาท\n";
                    $message_real .= "รายละเอียด : {$url}\n\n";
                }

                $msg_formatted['content']     = $message_real;
                $msg_formatted['contentType'] = 'text';
                break;
            case 'item':
                $p_json = $this->getProduct(
                    $ct['item_id'],
                    $ct['shop_id'],
                    $platform['shopee_partner_id'],
                    $platform['shopee_partner_key'],
                    $platform['accessToken']
                );
                Log::info(json_encode($p_json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

                $p_name = $p_json['response']['item_list'][0]['item_name'];
                $p_name = $p_json['response']['item_list'][0]['item_name'];
                $p_image = $p_json['response']['item_list'][0]['image']['image_url_list'][0]
                    ?? 'ไม่มีรูป';
                $p_action_url = "https://shopee.co.th/product/" .  $platform['shopee_shop_id'] . "/" . $p_json['response']['item_list'][0]['item_id'];
                $p_final = "ชื่อสินค้า : $p_name\n" . "ราคา : ไม่ทราบ\n" . "รายละเอียด : $p_action_url";

                $pd['name'] = $p_name;
                $pd['price'] = 0;
                $pd['image'] = $p_image;
                $pd['actionUrl'] = $p_action_url;
                $pf = [
                    "id"    => "0",
                    "name"  => $pd['name'],
                    "price" => $pd['price'],
                    "image" => $pd['image'],
                    "url"   => $pd['actionUrl']
                ];
                $pf_json = json_encode($pf, JSON_UNESCAPED_UNICODE);

                $msg_formatted['content'] = $pf_json;
                $msg_formatted['contentType'] = 'product';
                break;
            default:
                $msg_formatted['content']     = json_encode($ct, JSON_UNESCAPED_UNICODE);
                $msg_formatted['contentType'] = 'text';
                break;
        }

        $msg_formatted['meta'] = [
            'message_type' => $type,
            'raw_content'  => $ct,
        ];
        return $msg_formatted;
    }

    public static function pushReplyMessage($filter_case, $msg_id = null)
    {
        try {

            $filter_case_response = $filter_case['case'] ?? $filter_case;
            if (isset($filter_case_response['send_to_cust']) && !$filter_case_response['send_to_cust']) {
                return ['status'  => true, 'message' => 'ไม่ต้องส่งข้อความ'];
            }

            $platformToken = $filter_case_response['platform_access_token'] ?? null;
            $customer      = $filter_case_response['customer'] ?? null;
            $messages      = $filter_case_response['messages'] ?? [];

            if (!$platformToken || empty($platformToken['shopee_partner_id']) || empty($platformToken['shopee_partner_key']) || empty($platformToken['shopee_shop_id'])) {
                throw new \Exception("ไม่พบ Shopee credentials ใน platform_access_token");
            }

            $host        = 'https://partner.shopeemobile.com';
            $path        = '/api/v2/sellerchat/send_message';
            $timestamp   = time();

            $accessToken = self::getValidAccessToken($platformToken);
            $partnerId   = (int) $platformToken['shopee_partner_id'];
            $partnerKey  = $platformToken['shopee_partner_key'];
            $shopId      = (int) $platformToken['shopee_shop_id'];

            $sign = self::makeShopeeSign($path, $timestamp, $accessToken, $shopId, $partnerId, $partnerKey);

            $url = $host . $path . '?' . http_build_query([
                'partner_id'   => $partnerId,
                'timestamp'    => $timestamp,
                'sign'         => $sign,
                'shop_id'      => $shopId,
                'access_token' => $accessToken,
            ]);

            $messages_to_send = [];
            switch ($filter_case_response['type_send']) {
                case 'queue':
                    foreach ($messages as $message) {
                        $messages_to_send[] = [
                            'message_type'     => 'text',
                            'content'          => ['text' => $message['content'] ?? ''],
                            'content_original' => $message['content'] ?? ''
                        ];
                    }
                    break;
                case 'menu':
                    $menuLines = BotMenu::query()
                        ->where('botTokenId', $platformToken['id'])
                        ->get()
                        ->map(fn($bot) => ($bot->menu_number ?? '-') . '. ' . ($bot->menuName ?? '-'))
                        ->implode("\n");

                    $text = "✅เลือกเมนู\n" . ($menuLines ?: '- ยังไม่มีเมนู -');
                    $messages_to_send[] = [
                        'message_type'     => 'text',
                        'content'          => ['text' => "$text\n 📌 กรุณาเลือกเมนูที่ท่านต้องการสอบถาม พิมพ์เลขที่ต้องการ เช่น 1"],
                        'content_original' => $text
                    ];
                    break;
                case 'menu_sended':
                case 'present':
                    $text = $messages[0]['content'] ?? '';
                    $messages_to_send[] = [
                        'message_type'     => 'text',
                        'content'          => ['text' => $text],
                        'content_original' => $text
                    ];
                    break;
                case 'normal':
                    foreach ($messages as $message) {
                        if ($message['contentType'] === 'text') {
                            $messages_to_send[] = [
                                'message_type'     => 'text',
                                'content'          => ['text' => $message['content']],
                                'content_original' => $message['content']
                            ];
                        } elseif ($message['contentType'] === 'image') {
                            $uploadResp = self::uploadImageToShopee($message['content'], $platformToken);
                            $imageUrl   = $uploadResp['url'] ?? null;
                            if (empty($imageUrl)) {
                                throw new \Exception('Shopee: upload_image ไม่ได้ url');
                            }
                            $messages_to_send[] = [
                                'message_type'     => 'image',
                                'content'          => ['image_url' => $imageUrl],
                                'content_original' => $message['content']
                            ];
                        } elseif ($message['contentType'] === 'video') {
                            $v = self::uploadVideoToShopee($message['content'], $platformToken);
                            $messages_to_send[] = [
                                'message_type'     => 'video',
                                'content'          => [
                                    'vid'              => $v['vid'],
                                    'video_url'        => $v['video_url'],
                                    'thumb_url'        => $v['thumb_url'],
                                    'thumb_width'      => (int)($v['thumb_width'] ?? 0),
                                    'thumb_height'     => (int)($v['thumb_height'] ?? 0),
                                    'duration_seconds' => (int)($v['duration_seconds'] ?? 0),
                                ],
                                'content_original' => $message['content']
                            ];
                        }
                    }
                    break;
                case 'evaluation':
                    return [
                        'status'  => true,
                        'message' => 'Shopee: รับข้อความแบบประเมิน แต่ไม่สามารถส่งแบบประเมินได้'
                    ];
                case 'item':
                    return [];
                default:
                    $text = "ระบบไม่รองรับ type_send: " . $filter_case_response['type_send'];
                    $messages_to_send[] = [
                        'message_type'     => 'text',
                        'content'          => ['text' => $text],
                        'content_original' => $text
                    ];
                    break;
            }

            $sent_messages = [];
            foreach ($messages_to_send as $msg) {
                $toId = (int) $customer['custId'];
                $body = array_merge(['to_id' => $toId], $msg);

                $response = Http::withHeaders(['Content-Type' => 'application/json'])->post($url, $body);
                $json = $response->json();

                if ($response->successful() && empty($json['error'])) {
                    Log::info('Shopee: ส่งข้อความสำเร็จ', ['resp' => $json, 'body' => $body]);
                    $sent_messages[] = [
                        'content'     => $msg['content']['text']
                            ?? $msg['content']['image_url']
                            ?? $msg['content']['video_url']
                            ?? '',
                        'contentType' => $msg['message_type'],
                        'response'    => $json,
                        'content_original' => $msg['content_original']
                    ];
                } else {
                    Log::error('Shopee: ส่งข้อความไม่สำเร็จ', ['resp' => $json, 'body' => $body]);
                }
            }

            foreach ($sent_messages as $message) {
                $store_chat = new ChatHistory();
                $store_chat->custId = $customer['custId'];
                if ($message['contentType'] == 'video') {
                    $store_chat->content = $message['content_original'];
                } else {
                    $store_chat->content = $message['content'];
                }
                $store_chat->contentType = $message['contentType'];
                $store_chat->sender = json_encode($filter_case_response['employee'] ?? $filter_case_response['bot'] ?? ['name' => 'system']);
                $store_chat->conversationRef = $filter_case_response['ac_id'] ?? null;
                $store_chat->line_message_id = $msg_id;
                $store_chat->line_quote_token = $message['response']['response']['message_id'] ?? null;
                $store_chat->save();
            }

            $pusherService = new PusherService();
            if ($filter_case_response['type_send'] === 'present') {
                $pusherService->sendNotification($customer['custId'], 'มีการรับเรื่อง');
            } else {
                $pusherService->sendNotification($customer['custId'] ?? '');
            }
            return [
                'status'     => true,
                'message'    => 'Shopee: ส่งข้อความสำเร็จ',
                'sent_count' => count($sent_messages)
            ];
        } catch (\Exception $e) {
            Log::error('Shopee: pushReplyMessage error ❌', [
                'error' => $e->getMessage(),
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
            ]);
            return [
                'status'  => false,
                'message' => 'Shopee error: ' . $e->getMessage()
            ];
        }
    }

    private static function makeShopeeSign(string $path, int $timestamp, string $accessToken, int|string $shopId, int|string $partnerId, string $partnerKey): string
    {
        $baseString = $partnerId . $path . $timestamp . $accessToken . $shopId;
        return hash_hmac('sha256', $baseString, $partnerKey);
    }

    private static function uploadImageToShopee(string $imagePathOrUrl, $platformToken): array
    {
        if ($platformToken instanceof PlatformAccessTokens) {
            $pt = [
                'id'                 => $platformToken->id,
                'shopee_partner_id'  => (int) $platformToken->shopee_partner_id,
                'shopee_partner_key' => (string) $platformToken->shopee_partner_key,
                'shopee_shop_id'     => (int) $platformToken->shopee_shop_id,
                'accessToken'        => (string) $platformToken->accessToken,
            ];
        } elseif (is_array($platformToken)) {
            $pt = $platformToken;
        } else {
            throw new \Exception('Shopee: platformToken ต้องเป็น array หรือ PlatformAccessTokens');
        }

        if (
            empty($pt['shopee_partner_id']) ||
            empty($pt['shopee_partner_key']) ||
            empty($pt['shopee_shop_id'])    ||
            empty($pt['accessToken'])
        ) {
            throw new \Exception("Shopee: credentials ไม่ครบสำหรับอัปโหลดรูปภาพ");
        }

        $host        = 'https://partner.shopeemobile.com';
        $path        = '/api/v2/sellerchat/upload_image';
        $timestamp   = time();

        $partnerId   = (int) $pt['shopee_partner_id'];
        $partnerKey  = (string) $pt['shopee_partner_key'];
        $shopId      = (int) $pt['shopee_shop_id'];
        $accessToken = (string) $pt['accessToken'];

        $sign = self::makeShopeeSign($path, $timestamp, $accessToken, $shopId, $partnerId, $partnerKey);

        $url = $host . $path . '?' . http_build_query([
            'partner_id'   => $partnerId,
            'timestamp'    => $timestamp,
            'sign'         => $sign,
            'shop_id'      => $shopId,
            'access_token' => $accessToken,
        ]);

        // เตรียมไฟล์: รองรับ URL และ local path
        $cleanup = false;
        if (filter_var($imagePathOrUrl, FILTER_VALIDATE_URL)) {
            $tmp = sys_get_temp_dir() . '/' . uniqid('shp_img_');
            $ext = pathinfo(parse_url($imagePathOrUrl, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION) ?: 'jpg';
            $tmp = $tmp . '.' . strtolower($ext);

            $in = @fopen($imagePathOrUrl, 'rb');
            if (!$in) throw new \Exception("Shopee: ดาวน์โหลดรูปจาก URL ไม่สำเร็จ: {$imagePathOrUrl}");
            $out = @fopen($tmp, 'wb');
            if (!$out) {
                fclose($in);
                throw new \Exception("Shopee: เตรียมไฟล์ชั่วคราวไม่สำเร็จ");
            }
            stream_copy_to_stream($in, $out);
            fclose($in);
            fclose($out);

            $imagePath = $tmp;
            $cleanup = true;
        } else {
            $imagePath = $imagePathOrUrl;
            if (!is_file($imagePath)) throw new \Exception("Shopee: ไม่พบไฟล์รูปที่ระบุ: {$imagePath}");
        }

        try {
            $response = \Illuminate\Support\Facades\Http::asMultipart()
                ->attach('file', file_get_contents($imagePath), basename($imagePath))
                ->post($url);

            $json = $response->json();
            if (!$response->successful()) {
                throw new \Exception('HTTP error: ' . $response->status());
            }
            if (!empty($json['error'])) {
                throw new \Exception('Shopee upload_image error: ' . ($json['message'] ?? $json['error']));
            }

            $resp = $json['response'] ?? [];
            if (empty($resp['url'])) {
                throw new \Exception('Shopee upload_image ไม่คืน url');
            }

            Log::info('Shopee: upload_image success', $json);
            return $resp;
        } finally {
            if ($cleanup && !empty($imagePath) && is_file($imagePath)) @unlink($imagePath);
        }
    }

    private static function uploadVideoToShopee(string $videoPathOrUrl, $platformToken, int $maxWaitSec = 60): array
    {
        if ($platformToken instanceof PlatformAccessTokens) {
            $pt = [
                'shopee_partner_id'  => (int) $platformToken->shopee_partner_id,
                'shopee_partner_key' => (string) $platformToken->shopee_partner_key,
                'shopee_shop_id'     => (int) $platformToken->shopee_shop_id,
                'accessToken'        => (string) $platformToken->accessToken,
            ];
        } else {
            $pt = $platformToken;
        }

        $host = 'https://partner.shopeemobile.com';
        $path = '/api/v2/sellerchat/upload_video';
        $timestamp = time();
        $sign = self::makeShopeeSign($path, $timestamp, $pt['accessToken'], $pt['shopee_shop_id'], $pt['shopee_partner_id'], $pt['shopee_partner_key']);

        $url = $host . $path . '?' . http_build_query([
            'partner_id'   => $pt['shopee_partner_id'],
            'timestamp'    => $timestamp,
            'sign'         => $sign,
            'shop_id'      => $pt['shopee_shop_id'],
            'access_token' => $pt['accessToken'],
        ]);

        if (filter_var($videoPathOrUrl, FILTER_VALIDATE_URL)) {
            $tmp = sys_get_temp_dir() . '/' . uniqid('shp_vid_') . '.mp4';
            file_put_contents($tmp, file_get_contents($videoPathOrUrl));
            $videoPath = $tmp;
        } else {
            $videoPath = $videoPathOrUrl;
        }

        $resp = Http::asMultipart()
            ->attach('file', file_get_contents($videoPath), basename($videoPath))
            ->post($url);

        $json = $resp->json();
        if (!$resp->successful() || !empty($json['error'])) {
            throw new \Exception("Shopee upload_video error: " . json_encode($json));
        }

        $vid = $json['response']['vid'] ?? null;
        if (!$vid) throw new \Exception("Shopee ไม่คืน vid");

        $pathRes = '/api/v2/sellerchat/get_video_upload_result';
        $elapsed = 0;
        $interval = 3;

        while ($elapsed < $maxWaitSec) {
            $tsRes = time();
            $signRes = self::makeShopeeSign(
                $pathRes,
                $tsRes,
                $pt['accessToken'],
                $pt['shopee_shop_id'],
                $pt['shopee_partner_id'],
                $pt['shopee_partner_key']
            );

            $urlRes = $host . $pathRes . '?' . http_build_query([
                'partner_id'   => $pt['shopee_partner_id'],
                'timestamp'    => $tsRes,
                'sign'         => $signRes,
                'shop_id'      => $pt['shopee_shop_id'],
                'access_token' => $pt['accessToken'],
                'vid'          => $vid,
            ]);

            $result = Http::get($urlRes)->json();
            $info = $result['response'] ?? [];

            if (($info['status'] ?? '') === 'successful') {
                return [
                    'vid'              => $vid,
                    'video_url'        => $info['video'] ?? null,
                    'thumb_url'        => $info['thumbnail'] ?? null,
                    'duration_seconds' => intval(round(($info['duration'] ?? 0) / 1000)),
                    'thumb_width'      => $info['width'] ?? null,
                    'thumb_height'     => $info['height'] ?? null,
                ];
            }

            if (($info['status'] ?? '') === 'failed') {
                throw new \Exception("Shopee video upload failed: " . json_encode($result));
            }

            sleep($interval);
            $elapsed += $interval;
        }

        throw new \Exception("Shopee video upload not finished within {$maxWaitSec} seconds");
    }

    private static function getValidAccessToken(array|PlatformAccessTokens $platformToken): string
    {
        if ($platformToken instanceof PlatformAccessTokens) {
            $pt = $platformToken->toArray();
        } else {
            $pt = $platformToken;
        }

        $shopId = $pt['shopee_shop_id'];

        $row = DB::table('platform_access_tokens')
            ->where('shopee_shop_id', $shopId)
            ->first();

        if (!$row) {
            throw new \Exception("ไม่พบ shop_id {$shopId} ใน platform_access_tokens");
        }

        if (empty($row->expire_at) || Carbon::parse($row->expire_at)->isPast()) {
            return self::refreshAccessTokenFromShopee($row);
        }

        return $row->accessToken;
    }

    private static function refreshAccessTokenFromShopee($row): string
    {
        $host       = "https://partner.shopeemobile.com";
        $partnerId  = $row->shopee_partner_id;
        $partnerKey = $row->shopee_partner_key;
        $shopId     = $row->shopee_shop_id;
        $refreshTok = $row->shopee_refresh_token;

        $path      = "/api/v2/auth/access_token/get";
        $timestamp = time();
        $baseStr   = $partnerId . $path . $timestamp;
        $sign      = hash_hmac('sha256', $baseStr, $partnerKey);

        $url = $host . $path . '?' . http_build_query([
            'partner_id' => $partnerId,
            'timestamp'  => $timestamp,
            'sign'       => $sign,
        ]);

        $body = [
            'partner_id'    => (int)$partnerId,
            'shop_id'       => (int)$shopId,
            'refresh_token' => $refreshTok,
        ];

        $resp = Http::withHeaders(['Content-Type' => 'application/json'])->post($url, $body);
        $json = $resp->json();

        if (!$resp->successful() || !empty($json['error'])) {
            Log::error("Shopee refresh token error", $json);
            throw new \Exception("Shopee refresh token error: " . json_encode($json));
        }

        DB::table('platform_access_tokens')
            ->where('shopee_shop_id', $shopId)
            ->update([
                'accessToken'          => $json['access_token'],
                'shopee_refresh_token' => $json['refresh_token'],
                'expire_at'            => now()->addSeconds($json['expire_in']),
                'updated_at'           => now(),
            ]);

        return $json['access_token'];
    }

    private function getProduct($item_id, $shop_id, $partner_id, $partner_key, $access_token)
    {

        $timestamp = time();
        $path      = "/api/v2/product/get_item_base_info";

        // ✅ สร้าง sign ตาม Shopee Docs
        $base_string = $partner_id . $path . $timestamp . $access_token . $shop_id;
        $sign = hash_hmac('sha256', $base_string, $partner_key);

        $url = "https://partner.shopeemobile.com{$path}";

        // ✅ ส่ง request ด้วย Laravel Http Client
        $response = Http::get($url, [
            'access_token' => $access_token,
            'partner_id'   => $partner_id,
            'shop_id'      => $shop_id,
            'sign'         => $sign,
            'timestamp'    => $timestamp,
            'item_id_list' => $item_id,
        ]);

        // ✅ คืนค่า JSON กลับไป
        return $response->json();
    }
}
