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

    public function verify(Request $request)
    {
        Log::channel('webhook_shopee_new')->info('Shopee webhook verify called', $request->all());
        return response('ok');
    }

    // public function webhooks(Request $request)
    // {
    //     try {
    //         $raw  = $request->getContent();
    //         $payload = json_decode($raw, true);

    //         $shopIdTop = $payload['shop_id'] ?? null;
    //         $exists = DB::table('platform_access_tokens')
    //             ->where('platform', 'shopee')
    //             ->where('shopee_shop_id', $shopIdTop)
    //             ->exists();

    //         if (!$exists) {
    //             Log::channel('webhook_shopee_new')->warning("Shopee webhook: ข้าม shop_id {$shopIdTop} (ไม่พบใน platform_access_tokens)");
    //             return response()->json(['message' => "skip shop_id {$shopIdTop}"], 200);
    //         }

    //         Log::channel('webhook_shopee_new')->info(json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    //         $msgId = $payload['msg_id'] ?? null;
    //         $code = $payload['code'] ?? null;
    //         $data = $payload['data'] ?? [];
    //         $c = $data['content'] ?? [];
    //         $messageId = $c['message_id'] ?? null;
    //         $messageType = $c['message_type'] ?? null;
    //         $conversationId = $c['conversation_id'] ?? null;
    //         $fromId = $c['from_id'] ?? null;
    //         $fromName = $c['from_user_name'] ?? null;
    //         $textPayload = $c['content']['text'] ?? null;
    //         $shopIdTop = $payload['shop_id'] ?? null;

    //         $allowedTypes = ['text', 'image', 'video', 'item', 'item_list', 'order'];
    //         if ($messageType === 'bundle_message') {
    //             Log::channel('webhook_shopee_new')->info("Shopee webhook: ข้าม bundle_message", ['message_id' => $messageId]);
    //             return response()->json(['message' => 'skip bundle_message'], 200);
    //         }
    //         if ($code === 10 && ($data['type'] ?? null) === 'message' && in_array($messageType, $allowedTypes, true)) {
    //             $DuplicateId = ChatHistory::query()
    //                 ->where('line_message_id', $messageId)
    //                 ->first();
    //             if ($DuplicateId) {
    //                 Log::channel('webhook_shopee_new')->info('Shopee webhook duplicated', ['message_id' => $messageId]);
    //                 return response()->json(['message' => 'duplicate webhook'], 200);
    //             }
    //             Log::channel('webhook_shopee_new')->info($this->start_log_line);
    //             Log::channel('webhook_shopee_new')->info('รับ webhook จาก Shopee');
    //             Log::channel('webhook_shopee_new')->info('รับ webhook สำเร็จเป็น event ส่งข้อความ');
    //             $check = $this->check_customer_and_get_platform(
    //                 $conversationId,
    //                 $fromId,
    //                 $shopIdTop,
    //                 $fromName
    //             );
    //             $customer = $check['customer'];
    //             $platform = $check['platform'];
    //             $message_req = [
    //                 'message_id'   => $messageId,
    //                 'message_type' => $messageType,
    //                 'content'      => $c['content'] ?? [],
    //             ];
    //             $message_formatted = $this->format_message($message_req, $platform);

    //             $filter_case = $this->filterCase->filterCase($customer, $message_formatted, $platform, 2);
    //             Log::channel('webhook_shopee_new')->info(json_encode($filter_case, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    //             $push_result = $this->pushReplyMessage($filter_case, $messageId);
    //         } else {
    //             Log::channel('webhook_shopee_new')->info('ไม่เข้า');
    //         }
    //     } catch (\Throwable $e) {
    //         Log::channel('webhook_shopee_new')->error('Shopee webhook error ❌', [
    //             'error' => $e->getMessage(),
    //             'file'  => $e->getFile(),
    //             'line'  => $e->getLine(),
    //         ]);
    //     }
    //     Log::channel('webhook_shopee_new')->info($this->end_log_line);
    //     return response()->json(['message' => 'ok'], 200);
    // }

    public function webhooks(Request $request)
    {
        try {
            $raw  = $request->getContent();

            // LOG RAW PAYLOAD: พิมพ์ทุกอย่างที่เข้ามา เพื่อตรวจสอบว่า Shopee ส่ง Code อะไรมาให้
            Log::channel('webhook_shopee_new')->info("--- เริ่มรับ Webhook Shopee ---");
            Log::channel('webhook_shopee_new')->info($raw);

            $payload = json_decode($raw, true);
            $shopIdTop = $payload['shop_id'] ?? null;
            $code = $payload['code'] ?? null;
            $data = $payload['data'] ?? [];

            // ตรวจสอบว่า shop_id นี้มีอยู่ในระบบเราหรือไม่
            $exists = DB::table('platform_access_tokens')
                ->where('platform', 'shopee')
                ->where('shopee_shop_id', $shopIdTop)
                ->exists();

            if (!$exists) {
                Log::channel('webhook_shopee_new')->warning("Shopee webhook: ข้าม shop_id {$shopIdTop} (ไม่พบในตาราง)");
                return response()->json(['message' => "skip shop_id {$shopIdTop}"], 200);
            }

            // CASE 1: Webhook แจ้งเตือนสถานะออเดอร์ (Code 3)
            if ($code == 3) {
                Log::channel('webhook_shopee_new')->info("📦 ตรวจพบ event อัปเดตออเดอร์");
                $this->syncOrderToDatabase($data, $shopIdTop);
                return response()->json(['message' => 'order synced'], 200);
            }

            // CASE 2: Webhook ข้อความแชท (Code 10)
            if ($code == 10 && ($data['type'] ?? null) === 'message') {
                $c = $data['content'] ?? [];
                $messageId = $c['message_id'] ?? null;
                $messageType = $c['message_type'] ?? null;
                $conversationId = $c['conversation_id'] ?? null;
                $fromId = $c['from_id'] ?? null;
                $fromName = $c['from_user_name'] ?? null;

                $allowedTypes = ['text', 'image', 'video', 'item', 'item_list', 'order', 'sticker'];
                if ($messageType === 'bundle_message') return response()->json(['message' => 'skip'], 200);

                if (in_array($messageType, $allowedTypes, true)) {
                    // เช็ค Webhook ซ้ำ
                    $DuplicateId = ChatHistory::where('line_message_id', $messageId)->exists();
                    if ($DuplicateId) return response()->json(['message' => 'duplicate'], 200);

                    Log::channel('webhook_shopee_new')->info($this->start_log_line);

                    $check = $this->check_customer_and_get_platform(
                        $conversationId ?? '',
                        $fromId,
                        $shopIdTop,
                        $fromName
                    );

                    if ($check['customer'] && $check['platform']) {
                        $message_req = [
                            'message_id'   => $messageId,
                            'message_type' => $messageType,
                            'content'      => $c['content'] ?? [],
                        ];
                        $message_formatted = $this->format_message($message_req, $check['platform']);
                        $filter_case = $this->filterCase->filterCase($check['customer'], $message_formatted, $check['platform'], 2);

                        Log::channel('webhook_shopee_new')->info(json_encode($filter_case, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                        $this->pushReplyMessage($filter_case, $messageId);
                    }
                    Log::channel('webhook_shopee_new')->info($this->end_log_line);
                }
            }
        } catch (\Throwable $e) {
            Log::channel('webhook_shopee_new')->error('Shopee webhook error ❌', [
                'error' => $e->getMessage(),
                'line'  => $e->getLine(),
            ]);
        }
        return response()->json(['message' => 'ok'], 200);
    }

    private function syncOrderToDatabase(array $data, $shopId)
    {
        $orderSn = $data['order_sn'] ?? null;
        if (!$orderSn) return;

        try {
            // ดึงข้อมูล Platform จาก DB เพื่อเอา Token
            $platformRow = DB::table('platform_access_tokens')
                ->where('shopee_shop_id', (string)$shopId)
                ->first();

            if (!$platformRow) {
                Log::channel('webhook_shopee_new')->error("syncOrder: ไม่พบ Token สำหรับ shop_id {$shopId}");
                return;
            }

            $platformArr = (array)$platformRow;

            // ดึงฟิลด์ที่จำเป็นสำหรับการค้นหาและแสดงผลหน้า Chat
            $fields = 'buyer_user_id,buyer_username,order_status,total_amount,currency,create_time,item_list';
            $detailResp = $this->getOrderDetail([$orderSn], $platformArr, $fields);

            $od = $detailResp['order_list'][0] ?? null;

            if ($od) {
                // บันทึกลงตาราง orders (ถ้ามีอยู่แล้วให้ Update ถ้าไม่มีให้ Insert)
                DB::table('orders')->updateOrInsert(
                    ['order_sn' => $orderSn],
                    [
                        'platform'          => 'shopee',
                        'shop_id'           => (string)$shopId,
                        'buyer_user_id'     => (string)($od['buyer_user_id'] ?? ''),
                        'buyer_username'    => $od['buyer_username'] ?? null,
                        'order_status'      => $od['order_status'] ?? null,
                        'total_amount'      => (float)($od['total_amount'] ?? 0),
                        'currency'          => $od['currency'] ?? 'THB',
                        'order_create_time' => isset($od['create_time']) ? Carbon::createFromTimestamp($od['create_time']) : null,
                        'raw_data'          => json_encode($od, JSON_UNESCAPED_UNICODE),
                        'updated_at'        => now(),
                        'created_at'        => now(),
                    ]
                );

                Log::channel('webhook_shopee_new')->info("🚀 บันทึกออเดอร์ {$orderSn} ลงฐานข้อมูลเรียบร้อย");

                // อัปเดต buyerId ในตาราง Customers
                if (!empty($od['buyer_user_id'])) {
                    DB::table('customers')
                        ->where('buyerId', null)
                        ->where('custId', 'like', $od['buyer_user_id'] . '%')
                        ->update(['buyerId' => $od['buyer_user_id']]);
                }
            }
        } catch (\Exception $e) {
            Log::channel('webhook_shopee_new')->error("❌ syncOrderToDatabase Fail: " . $e->getMessage());
        }
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
        if (!$buyerId) {
            Log::channel('webhook_shopee_new')->error("Shopee webhook: ไม่พบ buyerId (from_id)");
            return ['platform' => $shopeePlatform, 'customer' => null];
        }

        $custKey = (string) $buyerId;
        $custId = $custKey . "_" . $shopeePlatform->id;

        $customer = Customers::query()->where('custId', $custId)->first();

        if ($customer) {
            if (empty($customer->buyerId)) {
                $customer->update(['buyerId' => $buyerId]);
                Log::channel('webhook_shopee_new')->info("📝 Update existing customer buyerId", [
                    'custId'  => $customer->custId,
                    'buyerId' => $buyerId,
                ]);
            }
            return [
                'platform' => $shopeePlatform,
                'customer' => $customer,
            ];
        }
        $custName = $fromUserName ?: "Shopee-" . $custKey;
        $newCustomer = Customers::query()->create([
            'custId'       => $custId,
            'custName'     => $custName,
            'description'  => "ติดต่อมาจาก Shopee " . $shopeePlatform->description,
            'avatar'       => null,
            'platformRef'  => $shopeePlatform->id,
            'buyerId'      => $buyerId,
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
            'reply_token'      => 'Send Token',
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
            // เพิ่ม Case สำหรับสติ๊กเกอร์
            case 'sticker':
                $sticker_id = $ct['sticker_id'] ?? null;
                $package_id = $ct['sticker_package_id'] ?? null;

                Log::channel('webhook_shopee_new')->info('🎭 sticker data', [
                    'sticker_id' => $sticker_id,
                    'package_id' => $package_id,
                    'ct'         => $ct,
                ]);

                if ($sticker_id && $package_id) {
                    $imageUrl = "https://deo.shopeemobile.com/shopee/shopee-sticker-live-th/packs/{$package_id}/{$sticker_id}@1x.png";
                    Log::channel('webhook_shopee_new')->info('🎭 sticker URL: ' . $imageUrl);
                    $msg_formatted['content']     = $imageUrl;
                    $msg_formatted['contentType'] = 'image';
                } else {
                    $msg_formatted['content']     = "[ลูกค้าส่งสติ๊กเกอร์]";
                    $msg_formatted['contentType'] = 'text';
                }
                break;
            // case 'item_list':
            //     $product_list = $ct['chat_product_infos'];
            //     $message_real = '';
            //     foreach ($product_list as $key => $product) {
            //         $imageUrl = "https://cf.shopee.co.th/file/" . $product['thumb_url'];
            //         $name     = $product['name'] ?? 'ไม่ทราบชื่อสินค้า';
            //         $minPrice = $product['min_price'] ?? 0;
            //         $maxPrice = $product['max_price'] ?? 0;
            //         $url      = "https://shopee.co.th/product/" . $product['shop_id'] . "/" . $product['item_id'];

            //         $message_real .= "รายการที่ " . ($key + 1) . "\n";
            //         $message_real .= "🖼️ รูป: {$imageUrl}\n";
            //         $message_real .= "{$name}\n";
            //         $message_real .= "ราคา : {$minPrice} - {$maxPrice} บาท\n";
            //         $message_real .= "รายละเอียด : {$url}\n\n";
            //     }

            //     $msg_formatted['content']     = $message_real;
            //     $msg_formatted['contentType'] = 'text';
            //     break;
            case 'item_list':
                $product_list = $ct['chat_product_infos'] ?? [];
                $items = [];

                foreach ($product_list as $p) {
                    $itemId  = $p['item_id'] ?? null;
                    $shopId  = $p['shop_id'] ?? ($platform['shopee_shop_id'] ?? null);
                    $name    = $p['name'] ?? 'ไม่ทราบชื่อสินค้า';
                    $thumbId = $p['thumb_url'] ?? ''; // เช่น th-..._tn

                    // ใช้ภาพใหญ่ขึ้น (ตัด _tn ออก ถ้ามี)
                    $imageId = (is_string($thumbId) && str_ends_with($thumbId, '_tn'))
                        ? substr($thumbId, 0, -3)
                        : $thumbId;
                    $image   = $imageId ? "https://cf.shopee.co.th/file/{$imageId}" : null;

                    // ราคาเดี่ยว/ช่วงราคา/ราคาเดิม
                    $price      = isset($p['price']) ? (float)$p['price'] : null;
                    $priceMin   = isset($p['min_price']) ? (float)$p['min_price'] : null;
                    $priceMax   = isset($p['max_price']) ? (float)$p['max_price'] : null;
                    $orig       = isset($p['price_before_discount']) ? (float)$p['price_before_discount'] : null;

                    $items[] = [
                        'id'            => (string)($itemId ?? '0'),
                        'shop_id'       => (string)($shopId ?? ''),
                        'name'          => $name,
                        'image'         => $image,
                        'url'           => ($itemId && $shopId) ? "https://shopee.co.th/product/{$shopId}/{$itemId}" : null,
                        'currency'      => 'THB',
                        'price'         => $price ?? $priceMin ?? 0,
                        'priceMin'      => $priceMin,
                        'priceMax'      => $priceMax,
                        'originalPrice' => $orig,
                    ];
                }

                $msg_formatted['content']     = json_encode(['items' => $items], JSON_UNESCAPED_UNICODE);
                $msg_formatted['contentType'] = 'item_list';
                break;
            case 'item':
                $itemId = $ct['item_id'] ?? null;
                $shopId = $ct['shop_id'] ?? ($platform['shopee_shop_id'] ?? null);

                $p_json = $this->getProduct(
                    $itemId,
                    $shopId,
                    $platform['shopee_partner_id'],
                    $platform['shopee_partner_key'],
                    $platform['accessToken']
                );
                Log::channel('webhook_shopee_new')->info(json_encode($p_json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

                $p = $p_json['response']['item_list'][0] ?? [];
                $p_name   = $p['item_name'] ?? 'ไม่ทราบชื่อสินค้า';
                $p_image  = $p['image']['image_url_list'][0] ?? null;
                $hasModel = (bool)($p['has_model'] ?? false);

                $priceInfo = $p['price_info'][0] ?? [];
                $currency  = $priceInfo['currency'] ?? 'THB';
                $price     = isset($priceInfo['current_price']) ? (float)$priceInfo['current_price'] : null;
                $orig      = isset($priceInfo['original_price']) ? (float)$priceInfo['original_price'] : null;

                $priceMin = null;
                $priceMax = null;
                if ($hasModel || $price === null) {
                    $range = $this->getModelPriceRange(
                        $itemId,
                        $shopId,
                        $platform['shopee_partner_id'],
                        $platform['shopee_partner_key'],
                        $platform['accessToken']
                    );
                    if (!empty($range)) {
                        $currency = $range['currency'] ?? $currency;
                        $priceMin = $range['min'] ?? null;
                        $priceMax = $range['max'] ?? null;
                        if ($price === null && $priceMin !== null) {
                            $price = (float)$priceMin;
                        }
                    }
                }

                $p_action_url = "https://shopee.co.th/product/" .  $platform['shopee_shop_id'] . "/" . ($p['item_id'] ?? $itemId);

                $pf = [
                    "id"             => (string)($p['item_id'] ?? $itemId ?? '0'),
                    "name"           => $p_name,
                    "image"          => $p_image ?: "https://cf.shopee.co.th/file/" . ($p['promotion_image']['image_id_list'][0] ?? ''),
                    "url"            => $p_action_url,

                    "currency"       => $currency,
                    "price"          => (float)($price ?? 0),
                    "originalPrice"  => $orig !== null ? (float)$orig : null,
                    "priceMin"       => $priceMin !== null ? (float)$priceMin : null,
                    "priceMax"       => $priceMax !== null ? (float)$priceMax : null
                ];
                $pf_json = json_encode($pf, JSON_UNESCAPED_UNICODE);

                $msg_formatted['content']     = $pf_json;
                $msg_formatted['contentType'] = 'product';
                break;
            case 'order': {
                    $ctRaw = $message_req['content'] ?? [];
                    $ct    = is_array($ctRaw) ? $ctRaw : [];
                    $orderSn = $ct['order_sn'] ?? null;

                    if (!$orderSn) {
                        $msg_formatted['content']     = 'ได้รับข้อความออเดอร์ แต่ไม่มีเลขที่คำสั่งซื้อ (order_sn)';
                        $msg_formatted['contentType'] = 'text';
                        break;
                    }

                    $fmtMoney = function ($num, $curr = 'THB') {
                        if ($num === null || $num === '') return '-';
                        return number_format((float)$num, 0) . ' ' . $curr;
                    };
                    $fmtTime = function ($ts) {
                        if (empty($ts)) return '-';
                        try {
                            return Carbon::createFromTimestamp($ts)->timezone('Asia/Bangkok')->format('d/m/Y H:i');
                        } catch (\Throwable $e) {
                            return (string)$ts;
                        }
                    };
                    $isMasked = function (?string $text) {
                        if ($text === null) return false;
                        $t = trim($text);
                        if ($t === '') return false;
                        $len = mb_strlen($t);
                        $stars = mb_substr_count($t, '*');
                        return ($t === '****') || ($len > 0 && ($stars / $len) >= 0.8);
                    };

                    try {
                        $detailResp = $this->getOrderDetail(
                            [$orderSn],
                            $platform,
                            'buyer_user_id,buyer_username,order_status,total_amount,currency,item_list,recipient_address,cod,create_time,update_time,pay_time'
                        );

                        // Log::channel('webhook_shopee_new')->info('Shopee getOrderDetail response', [
                        //     'order_sn' => $orderSn,
                        //     'resp'     => $detailResp
                        // ]);
                        Log::channel('webhook_shopee_new')->info(
                            "Shopee getOrderDetail response for order_sn={$orderSn}:\n" .
                                json_encode($detailResp, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
                        );

                        $od = $detailResp['order_list'][0] ?? null;
                        if (!$od) {
                            $msg_formatted['content']     = "🧾 Order {$orderSn} : ไม่พบรายละเอียด";
                            $msg_formatted['contentType'] = 'text';
                            break;
                        }

                        $buyer   = $od['buyer_username'] ?? '-';
                        $status  = $od['order_status'] ?? '-';
                        $amount  = $od['total_amount'] ?? 0;
                        $curr    = $od['currency'] ?? 'THB';
                        $cod     = $od['cod'] ?? null;

                        $created = $fmtTime($od['create_time'] ?? null);
                        $updated = $fmtTime($od['update_time'] ?? null);
                        $paidAt  = $fmtTime($od['pay_time'] ?? null);

                        $payText = ($cod === true) ? 'เก็บเงินปลายทาง (COD)' : ($paidAt !== '-' ? "ชำระแล้วเวลา: {$paidAt}" : '-');

                        $lines = [];
                        $lines[] = "🧾 รายละเอียดคำสั่งซื้อ";
                        $lines[] = "เลขที่: {$orderSn}";
                        $lines[] = "ผู้ซื้อ: {$buyer}";
                        $lines[] = "สถานะ: {$status}";
                        $lines[] = "ยอดรวม: " . $fmtMoney($amount, $curr);
                        $lines[] = "การชำระเงิน: {$payText}";
                        $lines[] = "สร้างเมื่อ: {$created}";
                        $lines[] = "อัปเดตล่าสุด: {$updated}";

                        $addrFull = $od['recipient_address']['full_address'] ?? null;
                        if ($addrFull !== null) {
                            if ($isMasked($addrFull)) {
                                $lines[] = "ที่อยู่ผู้รับ: (ข้อมูลถูกปิดบังตามนโยบายตลาด)";
                            } else {
                                $lines[] = "ที่อยู่ผู้รับ: " . $addrFull;
                            }
                        }

                        $items = $od['item_list'] ?? [];
                        $lines[] = "----------------------------------------";
                        $lines[] = "สินค้า (" . count($items) . " รายการ):";

                        foreach ($items as $i => $it) {
                            $name   = $it['item_name'] ?? '-';
                            $model  = $it['model_name'] ?? '-';
                            $qty    = $it['model_quantity_purchased'] ?? 0;
                            $price  = $it['model_discounted_price'] ?? 0;
                            $orig   = $it['model_original_price'] ?? null;
                            $img    = $it['image_info']['image_url'] ?? null;

                            $idx = $i + 1;
                            $line = "{$idx}) {$name}";
                            if ($model && $model !== '-') $line .= " • {$model}";
                            $line .= " • x{$qty}";
                            $line .= " • " . $fmtMoney($price, $curr);
                            if ($orig !== null && $orig != $price) {
                                $line .= " (เดิม " . $fmtMoney($orig, $curr) . ")";
                            }
                            $lines[] = $line;

                            // if ($img) {
                            //     $lines[] = "รูปสินค้า: {$img}";
                            // }
                        }

                        $msg_formatted['content']     = implode("\n", $lines);
                        $msg_formatted['contentType'] = 'text';
                    } catch (\Throwable $e) {
                        Log::channel('webhook_shopee_new')->error('getOrderDetail fail', [
                            'order_sn' => $orderSn,
                            'error'    => $e->getMessage(),
                            'file'     => $e->getFile(),
                            'line'     => $e->getLine(),
                        ]);
                        $msg_formatted['content']     = "🧾 Order {$orderSn} : ดึงรายละเอียดไม่สำเร็จ";
                        $msg_formatted['contentType'] = 'text';
                    }
                    break;
                }
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

    private function getModelPriceRange($item_id, $shop_id, $partner_id, $partner_key, $access_token): array
    {
        if (empty($item_id) || empty($shop_id)) return [];

        $host      = "https://partner.shopeemobile.com";
        $path      = "/api/v2/product/get_model_list";
        $timestamp = time();

        $base_string = $partner_id . $path . $timestamp . $access_token . $shop_id;
        $sign = hash_hmac('sha256', $base_string, $partner_key);

        $url = $host . $path . '?' . http_build_query([
            'partner_id'   => (int)$partner_id,
            'timestamp'    => $timestamp,
            'sign'         => $sign,
            'shop_id'      => (int)$shop_id,
            'access_token' => (string)$access_token,
            'item_id'      => (string)$item_id,
        ]);

        $resp = Http::get($url);
        $json = $resp->json();

        if (!$resp->successful() || !empty($json['error'])) {
            Log::channel('webhook_shopee_new')->warning('get_model_list error', ['resp' => $json]);
            return [];
        }

        $models = $json['response']['model_list'] ?? $json['response']['model'] ?? [];
        if (empty($models)) return [];

        $min = null;
        $max = null;
        $currency = 'THB';
        foreach ($models as $m) {
            $pi = $m['price_info'][0] ?? [];
            if (!isset($pi['current_price'])) continue;

            $currency = $pi['currency'] ?? $currency;
            $cp = (float)$pi['current_price'];
            $min = ($min === null) ? $cp : min($min, $cp);
            $max = ($max === null) ? $cp : max($max, $cp);
        }

        if ($min === null && $max === null) return [];
        return ['min' => $min, 'max' => $max, 'currency' => $currency];
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
                        } elseif ($message['contentType'] === 'item' || $message['contentType'] === 'product') {
                            $itemIdStr = is_numeric($message['content'])
                                ? (string)$message['content']
                                : (string)(json_decode($message['content'])->id ?? 0);

                            if (!empty($itemIdStr) && $itemIdStr !== '0') {
                                $messages_to_send[] = [
                                    'message_type'     => 'item',
                                    'content'          => [
                                        'item_id' => (int)$itemIdStr // 💡 ลบ shop_id ออก ส่งแค่ item_id
                                    ],
                                    'content_original' => (string)$message['content']
                                ];
                            }
                        }
                    }
                    break;
                case 'evaluation':
                    return [
                        'status'  => true,
                        'message' => 'Shopee: รับข้อความแบบประเมิน แต่ไม่สามารถส่งแบบประเมินได้'
                    ];
                case 'item':
                    // เดิม: return [];
                    $itemData = is_array($messages[0]['content'] ?? null)
                        ? $messages[0]['content']
                        : json_decode($messages[0]['content'] ?? '{}', true);

                    $itemId = $itemData['id'] ?? null;
                    $itemShopId = $itemData['shop_id'] ?? $platformToken['shopee_shop_id'];

                    if ($itemId) {
                        $messages_to_send[] = [
                            'message_type'     => 'item',
                            'content'          => [
                                'item_id' => (int)$itemId,
                                // 'shop_id' => (int)$itemShopId,
                            ],
                            'content_original' => $itemData['name'] ?? "สินค้า #{$itemId}",
                        ];
                    }
                    break;
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
                $cut_underscore_custId = $customer['custId'];
                $cut_underscore_custId = explode("_", $cut_underscore_custId)[0];
                $toId = (int) $cut_underscore_custId;

                // $body = array_merge(['to_id' => $toId, 'quote_message_id' => $msg_id], $msg);

                $shopeebody = [
                    'to_id'        => $toId,
                    'message_type' => $msg['message_type'],
                    'content'      => $msg['content']
                ];

                if (!empty($msg_id)) {
                    $shopeebody['quote_message_id'] = (string)$msg_id;
                }

                // $response = Http::withHeaders(['Content-Type' => 'application/json'])->post($url, $body);
                $response = Http::withHeaders(['Content-Type' => 'application/json'])->post($url, $shopeebody);
                $json = $response->json();

                if ($response->successful() && empty($json['error'])) {
                    Log::channel('webhook_shopee_new')->info('Shopee: ส่งข้อความสำเร็จ', ['resp' => $json, 'body' => $shopeebody]);
                    // $sent_messages[] = [
                    //     'content'     => $msg['content']['text']
                    //         ?? $msg['content']['image_url']
                    //         ?? $msg['content']['video_url']
                    //         ?? '',
                    //     'contentType' => $msg['message_type'],
                    //     'response'    => $json,
                    //     'content_original' => $msg['content_original']
                    // ];
                    $sent_messages[] = [
                        'content'     => $msg['content']['text']
                            ?? $msg['content']['image_url']
                            ?? $msg['content']['video_url']
                            ?? (isset($msg['content']['item_id'])
                                ? json_encode($msg['content'])
                                : ''),
                        'contentType' => $msg['message_type'],
                        'response'    => $json,
                        'content_original' => $msg['content_original']
                    ];
                } else {
                    Log::channel('webhook_shopee_new')->error('Shopee: ส่งข้อความไม่สำเร็จ', ['resp' => $json, 'body' => $body]);
                }
            }

            foreach ($sent_messages as $message) {
                $store_chat = new ChatHistory();
                $store_chat->custId = $customer['custId'];
                // if ($message['contentType'] == 'video') {
                if ($message['contentType'] == 'video' || $message['contentType'] == 'item') {
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
            Log::channel('webhook_shopee_new')->error('Shopee: pushReplyMessage error ❌', [
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

        // try {
        //     $response = Http::asMultipart()
        //         ->attach('file', file_get_contents($imagePath), basename($imagePath))
        //         ->post($url);

        //     $json = $response->json();
        //     if (!$response->successful()) {
        //         throw new \Exception('HTTP error: ' . $response->status());
        //     }
        //     if (!empty($json['error'])) {
        //         throw new \Exception('Shopee upload_image error: ' . ($json['message'] ?? $json['error']));
        //     }

        //     $resp = $json['response'] ?? [];
        //     if (empty($resp['url'])) {
        //         throw new \Exception('Shopee upload_image ไม่คืน url');
        //     }

        //     Log::channel('webhook_shopee_new')->info('Shopee: upload_image success', $json);
        //     return $resp;
        // } finally {
        //     if ($cleanup && !empty($imagePath) && is_file($imagePath)) @unlink($imagePath);
        // }

        try {
            // เพิ่ม User-Agent เพื่อหลบการบล็อกของ Firewall Shopee
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            ])
                ->asMultipart()
                ->attach('file', file_get_contents($imagePath), basename($imagePath))
                ->post($url);

            $json = $response->json();

            // เปลี่ยนมาดึง Body เพื่อดูข้อความ Error ที่แท้จริงจาก Shopee
            if (!$response->successful()) {
                throw new \Exception('HTTP error: ' . $response->status() . ' | รายละเอียด: ' . $response->body());
            }
            if (!empty($json['error'])) {
                throw new \Exception('Shopee upload_image error: ' . ($json['message'] ?? $json['error']));
            }

            $resp = $json['response'] ?? [];
            if (empty($resp['url'])) {
                throw new \Exception('Shopee upload_image ไม่คืน url | รายละเอียด: ' . $response->body());
            }

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

        // $resp = Http::asMultipart()
        //     ->attach('file', file_get_contents($videoPath), basename($videoPath))
        //     ->post($url);

        // $json = $resp->json();
        // if (!$resp->successful() || !empty($json['error'])) {
        //     throw new \Exception("Shopee upload_video error: " . json_encode($json));
        // }

        // เพิ่ม User-Agent
        $resp = Http::withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        ])
            ->asMultipart()
            ->attach('file', file_get_contents($videoPath), basename($videoPath))
            ->post($url);

        $json = $resp->json();

        // ดึงรายละเอียด Body มาโชว์ใน Error
        if (!$resp->successful() || !empty($json['error'])) {
            throw new \Exception("Shopee upload_video error HTTP " . $resp->status() . " : " . $resp->body());
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
            Log::channel('webhook_shopee_new')->error("Shopee refresh token error", $json);
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

    //-------------------------------------------------------------order api-----------------------------------------------------------------------
    private function getProduct($item_id, $shop_id, $partner_id, $partner_key, $access_token)
    {

        $timestamp = time();
        $path      = "/api/v2/product/get_item_base_info";

        $base_string = $partner_id . $path . $timestamp . $access_token . $shop_id;
        $sign = hash_hmac('sha256', $base_string, $partner_key);

        $url = "https://partner.shopeemobile.com{$path}";

        $response = Http::get($url, [
            'access_token' => $access_token,
            'partner_id'   => $partner_id,
            'shop_id'      => $shop_id,
            'sign'         => $sign,
            'timestamp'    => $timestamp,
            'item_id_list' => $item_id,
        ]);

        return $response->json();
    }

    private function getOrderDetail(array $orderSnList, $platform, ?string $optionalFields = null): array
    {
        $pt = ($platform instanceof PlatformAccessTokens) ? $platform->toArray() : $platform;
        foreach (['shopee_partner_id', 'shopee_partner_key', 'shopee_shop_id'] as $k) {
            if (empty($pt[$k])) throw new \Exception("Shopee credentials ขาด: {$k}");
        }

        $host        = 'https://partner.shopeemobile.com';
        $path        = '/api/v2/order/get_order_detail';
        $accessToken = self::getValidAccessToken($pt);
        $partnerId   = (int) $pt['shopee_partner_id'];
        $partnerKey  = (string) $pt['shopee_partner_key'];
        $shopId      = (int) $pt['shopee_shop_id'];

        $allOrders = [];

        foreach (array_chunk($orderSnList, 50) as $chunk) {
            $timestamp = time();
            $sign = self::makeShopeeSign($path, $timestamp, $accessToken, $shopId, $partnerId, $partnerKey);

            $query = [
                'partner_id'                   => $partnerId,
                'timestamp'                    => $timestamp,
                'sign'                         => $sign,
                'shop_id'                      => $shopId,
                'access_token'                 => $accessToken,
                'order_sn_list'                => implode(',', $chunk),
                'request_order_status_pending' => 'true',
            ];
            if (!empty($optionalFields)) {
                $query['response_optional_fields'] = $optionalFields;
            }

            $url  = $host . $path . '?' . http_build_query($query);
            $resp = Http::get($url);
            $json = $resp->json();

            if (!$resp->successful() || !empty($json['error'])) {
                throw new \Exception('get_order_detail error: ' . ($json['message'] ?? json_encode($json)));
            }

            $orders = $json['response']['order_list'] ?? [];
            $allOrders = array_merge($allOrders, $orders);
        }

        return [
            'order_list' => $allOrders,
        ];
    }

    // public function customerOrders($custId)
    // {
    //     $customer = Customers::where('custId', $custId)->firstOrFail();
    //     $platform = PlatformAccessTokens::findOrFail($customer->platformRef);

    //     Log::channel('webhook_shopee_new')->info("📌 กดดูออเดอร์ของลูกค้า", [
    //         'custId'   => $custId,
    //         'buyerId'  => $customer->buyerId,
    //         'platform' => $platform->platform ?? null,
    //         'shop_id'  => $platform->shopee_shop_id ?? null,
    //     ]);

    //     if (empty($customer->buyerId)) {
    //         Log::channel('webhook_shopee_new')->warning("⚠️ ยังไม่มี buyerId สำหรับลูกค้า", [
    //             'custId' => $custId
    //         ]);
    //         return response()->json([
    //             'status' => false,
    //             'message' => 'ยังไม่มี buyerId สำหรับลูกค้าคนนี้'
    //         ]);
    //     }

    //     try {
    //         $orderSnList = $this->getRecentOrderSnList($platform, 90);
    //         Log::channel('webhook_shopee_new')->info("✅ ได้ order_sn list", [
    //             'custId'   => $custId,
    //             'count'    => count($orderSnList),
    //             'order_sn' => $orderSnList,
    //         ]);

    //         if (empty($orderSnList)) {
    //             return response()->json([
    //                 'status' => true,
    //                 'orders' => [],
    //                 'count'  => 0,
    //             ]);
    //         }

    //         $detailResp = $this->getOrderDetail(
    //             $orderSnList,
    //             $platform,
    //             'buyer_user_id,buyer_username,order_status,total_amount,currency,create_time'
    //         );

    //         Log::channel('webhook_shopee_new')->info("📦 getOrderDetail response", [
    //             'custId' => $custId,
    //             'orders' => $detailResp['order_list'] ?? []
    //         ]);

    //         $orders = collect($detailResp['order_list'] ?? [])
    //             ->filter(fn($o) => ($o['buyer_user_id'] ?? null) == $customer->buyerId)
    //             ->map(fn($o) => [
    //                 'order_sn'   => $o['order_sn'] ?? null,
    //                 'status'     => $o['order_status'] ?? '-',
    //                 'price'      => $o['total_amount'] ?? 0,
    //                 'currency'   => $o['currency'] ?? 'THB',
    //                 'created_at' => isset($o['create_time'])
    //                     ? Carbon::createFromTimestamp($o['create_time'])->format('Y-m-d H:i')
    //                     : null,
    //             ])
    //             ->values()
    //             ->toArray();

    //         Log::channel('webhook_shopee_new')->info("🎯 Orders filtered by buyerId", [
    //             'custId' => $custId,
    //             'count'  => count($orders),
    //         ]);

    //         return response()->json([
    //             'status' => true,
    //             'orders' => $orders,
    //             'count'  => count($orders),
    //         ]);
    //     } catch (\Throwable $e) {
    //         Log::channel('webhook_shopee_new')->error('customerOrders error', [
    //             'custId' => $custId,
    //             'error'  => $e->getMessage(),
    //             'line'   => $e->getLine(),
    //             'file'   => $e->getFile(),
    //         ]);
    //         return response()->json([
    //             'status' => false,
    //             'message' => $e->getMessage()
    //         ], 500);
    //     }
    // }

    public function customerOrders($custId)
    {
        $customer = Customers::where('custId', $custId)->firstOrFail();
        $platform = PlatformAccessTokens::findOrFail($customer->platformRef);

        Log::channel('webhook_shopee_new')->info("📌 กดดูออเดอร์ของลูกค้าจาก DB", [
            'custId'   => $custId,
            'buyerId'  => $customer->buyerId,
        ]);

        if (empty($customer->buyerId)) {
            Log::channel('webhook_shopee_new')->warning("⚠️ ยังไม่มี buyerId สำหรับลูกค้า", [
                'custId' => $custId
            ]);
            return response()->json([
                'status' => false,
                'message' => 'ยังไม่มี buyerId สำหรับลูกค้าคนนี้'
            ]);
        }

        try {
            // 🚀 โค้ดใหม่: ดึงข้อมูลจากฐานข้อมูลโดยตรง (เร็วแบบไม่ต้องรอ API)
            $orders = DB::table('orders')
                ->where('buyer_user_id', (string)$customer->buyerId)
                ->where('platform', 'shopee')
                ->where('shop_id', (string)$platform->shopee_shop_id)
                ->orderBy('order_create_time', 'desc')
                ->get();

            // ถ้าไม่มีออเดอร์ในระบบ
            if ($orders->isEmpty()) {
                Log::channel('webhook_shopee_new')->info("✅ ไม่พบประวัติออเดอร์ในระบบ");
                return response()->json([
                    'status' => true,
                    'orders' => [],
                    'count'  => 0,
                ]);
            }

            // Map ข้อมูลเพื่อส่งไปให้หน้าบ้าน (React) ในฟอร์แมตที่ต้องการ
            $mappedOrders = $orders->map(function ($o) {
                // แกะ raw_data ที่เราเก็บเป็น JSON ไว้
                $rawData = json_decode($o->raw_data, true);

                // สำหรับ Shopee รายการสินค้าจะอยู่ที่ item_list
                // สำหรับ Lazada รายการสินค้าจะอยู่ที่ items
                $items = $rawData['item_list'] ?? $rawData['items'] ?? [];

                // รวมชื่อสินค้าทุกรายการในออเดอร์นั้นมาเป็นสายอักขระเดียว (String)
                $productNames = collect($items)->map(function ($item) {
                    // Shopee ใช้ 'item_name', Lazada ใช้ 'name'
                    return $item['item_name'] ?? $item['name'] ?? 'ไม่ทราบชื่อสินค้า';
                })->join(', ');
                return [
                    'order_sn'   => $o->order_sn,
                    'status'     => $o->order_status ?? '-',
                    'price'      => (float)$o->total_amount,
                    'currency'   => $o->currency ?? 'THB',
                    'created_at' => $o->order_create_time ? Carbon::parse($o->order_create_time)->format('Y-m-d H:i') : null,
                    'product_names' => $productNames,
                ];
            })->toArray();

            Log::channel('webhook_shopee_new')->info("🎯 ส่งข้อมูลออเดอร์จาก DB สำเร็จ", [
                'custId' => $custId,
                'count'  => count($mappedOrders),
            ]);

            return response()->json([
                'status' => true,
                'orders' => $mappedOrders,
                'count'  => count($mappedOrders),
            ]);
        } catch (\Throwable $e) {
            Log::channel('webhook_shopee_new')->error('customerOrders error', [
                'custId' => $custId,
                'error'  => $e->getMessage(),
                'line'   => $e->getLine(),
                'file'   => $e->getFile(),
            ]);
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function getRecentOrderSnList($platform, int $days = 90): array
    {
        $pt = ($platform instanceof PlatformAccessTokens) ? $platform->toArray() : $platform;
        foreach (['shopee_partner_id', 'shopee_partner_key', 'shopee_shop_id'] as $k) {
            if (empty($pt[$k])) throw new \Exception("Shopee credentials ขาด: {$k}");
        }

        $host        = 'https://partner.shopeemobile.com';
        $path        = '/api/v2/order/get_order_list';
        $accessToken = self::getValidAccessToken($pt);
        $partnerId   = (int) $pt['shopee_partner_id'];
        $partnerKey  = (string) $pt['shopee_partner_key'];
        $shopId      = (int) $pt['shopee_shop_id'];

        $allOrders = [];
        $timeTo = time();
        $timeFrom = $timeTo - ($days * 86400);

        $chunkDays = 15 * 86400;
        for ($start = $timeFrom; $start < $timeTo; $start += $chunkDays) {
            $end = min($start + $chunkDays - 1, $timeTo);

            $timestamp = time();
            $sign = self::makeShopeeSign($path, $timestamp, $accessToken, $shopId, $partnerId, $partnerKey);

            $query = [
                'partner_id'       => $partnerId,
                'timestamp'        => $timestamp,
                'sign'             => $sign,
                'shop_id'          => $shopId,
                'access_token'     => $accessToken,
                'time_range_field' => 'create_time',
                'time_from'        => $start,
                'time_to'          => $end,
                'page_size'        => 50,
            ];

            $url  = $host . $path . '?' . http_build_query($query);
            $resp = Http::get($url);
            $json = $resp->json();

            if (!$resp->successful() || !empty($json['error'])) {
                throw new \Exception('get_order_list error: ' . ($json['message'] ?? json_encode($json)));
            }

            $orders = $json['response']['order_list'] ?? [];
            $allOrders = array_merge($allOrders, $orders);
        }

        return collect($allOrders)->pluck('order_sn')->toArray();
    }

    public function testOrderDetail(Request $request)
    {
        $orderSn = $request->input('order_sn');
        if (empty($orderSn)) {
            return response()->json([
                'status'  => false,
                'message' => 'กรุณาส่ง order_sn',
            ], 400);
        }

        try {
            // หาร้านที่เชื่อมกับ Shopee
            $platform = PlatformAccessTokens::where('platform', 'shopee')
                ->orderByDesc('id')
                ->first();

            if (!$platform) {
                return response()->json([
                    'status'  => false,
                    'message' => 'ไม่พบ Shopee platform token',
                ], 404);
            }

            $detailResp = $this->getOrderDetail(
                [$orderSn],
                $platform,
                'buyer_user_id,buyer_username,buyer_message,order_status,total_amount,currency,
             item_list,recipient_address,shipping_carrier,tracking_no,payment_method,
             pay_time,cod,create_time,update_time,ship_by_date,
             voucher_code,voucher_info,voucher_platform,discount_amount'
            );

            $od = $detailResp['order_list'][0] ?? null;
            if (!$od) {
                return response()->json([
                    'status'  => false,
                    'message' => "ไม่พบรายละเอียด order_sn: {$orderSn}"
                ]);
            }

            // map item_list
            $items = collect($od['item_list'] ?? [])->map(fn($it) => [
                'item_id'            => $it['item_id'] ?? null,
                'name'               => $it['item_name'] ?? null,
                'model'              => $it['model_name'] ?? null,
                'sku'                => $it['model_sku'] ?? null,
                'quantity'           => $it['model_quantity_purchased'] ?? 0,
                'price'              => $it['model_discounted_price'] ?? 0,
                'original_price'     => $it['model_original_price'] ?? null,
                'currency'           => $od['currency'] ?? 'THB',
                'image_url'          => $it['image_info']['image_url'] ?? null,
                'promotion_type'     => $it['item_promotion_type'] ?? null,
                'promotion_id'       => $it['item_promotion_id'] ?? null,
                'promotion_platform' => $it['item_promotion_platform'] ?? null,
                'is_add_on_deal'     => $it['is_add_on_deal'] ?? false,
            ])->toArray();

            // ส่งกลับ
            return response()->json([
                'status' => true,
                'order'  => [
                    'order_sn'    => $od['order_sn'] ?? null,
                    'buyer'       => [
                        'id'       => $od['buyer_user_id'] ?? null,
                        'username' => $od['buyer_username'] ?? '-',
                        'message'  => $od['buyer_message'] ?? null,
                    ],
                    'status'      => $od['order_status'] ?? '-',
                    'amount'      => $od['total_amount'] ?? 0,
                    'currency'    => $od['currency'] ?? 'THB',
                    'voucher'     => [
                        'code'     => $od['voucher_code'] ?? null,
                        'info'     => $od['voucher_info'] ?? null,
                        'platform' => $od['voucher_platform'] ?? null,
                        'discount' => $od['discount_amount'] ?? 0,
                    ],
                    'payment'     => [
                        'method'   => $od['payment_method'] ?? null,
                        'cod'      => $od['cod'] ?? null,
                        'pay_time' => isset($od['pay_time'])
                            ? Carbon::createFromTimestamp($od['pay_time'])->format('Y-m-d H:i')
                            : null,
                    ],
                    'shipping'    => [
                        'carrier'    => $od['shipping_carrier'] ?? null,
                        'tracking'   => $od['tracking_no'] ?? null,
                        'ship_by'    => isset($od['ship_by_date'])
                            ? Carbon::createFromTimestamp($od['ship_by_date'])->format('Y-m-d H:i')
                            : null,
                        'recipient'  => $od['recipient_address']['full_address'] ?? null,
                        'zipcode'    => $od['recipient_address']['zipcode'] ?? null,
                    ],
                    'create_time' => isset($od['create_time'])
                        ? Carbon::createFromTimestamp($od['create_time'])->format('Y-m-d H:i')
                        : null,
                    'update_time' => isset($od['update_time'])
                        ? Carbon::createFromTimestamp($od['update_time'])->format('Y-m-d H:i')
                        : null,
                    'items'       => $items,
                ]
            ]);
        } catch (\Throwable $e) {
            Log::channel('webhook_shopee_new')->error('testOrderDetail error', [
                'order_sn' => $orderSn,
                'error'    => $e->getMessage(),
                'file'     => $e->getFile(),
                'line'     => $e->getLine(),
            ]);
            return response()->json([
                'status'  => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function searchProducts(Request $request)
    {
        $keyword = trim($request->input('keyword', ''));
        $custId  = $request->input('custId');

        try {
            $customer = Customers::where('custId', $custId)->firstOrFail();
            $platform = PlatformAccessTokens::findOrFail($customer->platformRef);
            $shopId   = (string)$platform->shopee_shop_id;

            // Query จาก shopee_product_mapping ใน PostgreSQL DB
            $items = DB::connection('n8n')  // ชื่อ connection ที่ต่อไปยัง n8n_database
                ->table('shopee_product_mapping')
                ->where('shop_id', $shopId)
                ->where(function ($q) use ($keyword) {
                    if ($keyword !== '') {
                        // 💡 แก้ไขที่ 1: บังคับแปลง (Cast) คอลัมน์เป็น ::text ก่อนใช้ ilike เพื่อให้ PostgreSQL ค้นหาตัวเลขได้ไม่พัง
                        $q->whereRaw('item_name::text ilike ?', ["%{$keyword}%"])
                            ->orWhereRaw('item_id::text ilike ?', ["%{$keyword}%"])
                            ->orWhereRaw('seller_sku::text ilike ?', ["%{$keyword}%"]);
                    }
                })
                ->select('item_id', 'item_name', 'seller_sku', 'current_stock', 'shop_id', 'shop_name', 'current_price')
                // 💡 แก้ไขที่ 2: distinct ต้องเรียงลำดับ column เดียวกันกับ orderBy ตัวแรกเสมอ!
                ->distinct('item_id')
                ->orderBy('item_id')   // <-- เพิ่มบรรทัดนี้เข้ามา
                ->orderBy('item_name')
                ->limit(20)
                ->get();

            // // นำข้อมูลมา Map ให้หน้าบ้าน React อ่านออก
            // $result = $items->map(function ($p) {
            //     return [
            //         'id'         => (string)$p->item_id,
            //         'shop_id'    => (string)$p->shop_id,
            //         'name'       => $p->item_name ?? '-',
            //         'seller_sku' => $p->seller_sku ?? '',
            //         // ใส่รูป Default ของ Shopee ไปก่อน เผื่อตารางไม่มีคอลัมน์รูป
            //         'image'      => 'https://pumpkin-image-sku.s3.ap-southeast-1.amazonaws.com/pumpkin-image-logo/logo.png',
            //         'price'      => $p->current_price ?? 0,
            //         'stock'      => $p->current_stock ?? 0,
            //     ];
            // })->toArray();

            // ดึง SKU ทั้งหมดเพื่อขอรูปจาก Warranty API
            $skuList = $items->pluck('seller_sku')->filter()->unique()->values();

            // ดึงรูปทีละ SKU แล้วเก็บลง Map (sku => imageUrl)
            $imageMap = [];
            foreach ($skuList as $sku) {
                if (empty(trim((string)$sku))) continue;
                try {
                    $warrantyResp = Http::timeout(5)
                        ->get('https://warranty-sn.pumpkin.tools/api/getdata', [
                            'search' => (string)$sku,
                        ]);
                    if ($warrantyResp->successful()) {
                        $wData = $warrantyResp->json();
                        $firstImage = $wData['main_assets']['imagesku'][0] ?? null;
                        if ($firstImage) {
                            $imageMap[(string)$sku] = $firstImage;
                        }
                    }
                } catch (\Throwable $e) {
                    Log::channel('webhook_shopee_new')->warning("searchProducts: ดึงรูปจาก Warranty API ไม่สำเร็จ", [
                        'sku'   => $sku,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            $defaultImage = 'https://pumpkin-image-sku.s3.ap-southeast-1.amazonaws.com/pumpkin-image-logo/logo.png';

            // นำข้อมูลมา Map ให้หน้าบ้าน React อ่านออก
            $result = $items->map(function ($p) use ($imageMap, $defaultImage) {
                $sku = (string)($p->seller_sku ?? '');
                return [
                    'id'         => (string)$p->item_id,
                    'shop_id'    => (string)$p->shop_id,
                    'name'       => $p->item_name ?? '-',
                    'seller_sku' => $sku,
                    'image'      => $imageMap[$sku] ?? $defaultImage,
                    'price'      => $p->current_price ?? 0,
                    'stock'      => $p->current_stock ?? 0,
                ];
            })->toArray();

            Log::channel('webhook_shopee_new')->info("🔍 ค้นหาสินค้าใน DB", [
                'custId'  => $custId,
                'keyword' => $keyword,
                'results' => $result,
            ]);


            // ส่งข้อมูลกลับให้ React รูปแบบที่ ShopeeProductPicker.jsx ต้องการ
            return response()->json([
                'items' => $result
            ]);
        } catch (\Throwable $e) {
            Log::channel('webhook_shopee_new')->error('searchProducts error ❌', [
                'error' => $e->getMessage(),
                'line'  => $e->getLine(),
                'file'  => $e->getFile(),
            ]);

            return response()->json([
                'message' => 'เกิดข้อผิดพลาดในการค้นหาสินค้า: ' . $e->getMessage()
            ], 500);
        }
    }
}
