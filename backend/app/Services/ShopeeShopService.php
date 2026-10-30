<?php

namespace App\Services;

use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * เรียก Shopee Open Platform API v2 (ระดับร้าน) ด้วย token ใน platform_access_tokens
 * คืนข้อมูลรูปแบบเดียวกับ TikTokShopService เพื่อใช้หน้าแสดงผลร่วมกัน
 */
class ShopeeShopService
{
    private const HOST = 'https://partner.shopeemobile.com';

    /** get_order_list ค้นได้ช่วงละไม่เกิน 15 วัน */
    public const ORDER_DAYS = 15;

    /** กรองเคยแชท: ไล่ get_order_list ได้สูงสุดกี่หน้า (หน้าละ 50 = get_order_detail ได้สูงสุดต่อครั้ง) ต่อการโหลดหนึ่งครั้ง */
    private const CHAT_SCAN_PAGES = 5;

    public function shops(PlatformAccessTokens $token): array
    {
        return Cache::remember("shopee_shops:{$token->id}", now()->addDay(), function () use ($token) {
            $data = $this->call($token, '/api/v2/shop/get_shop_info', [], false);
            return [[
                'id'     => (string) $token->shopee_shop_id,
                'name'   => $data['shop_name'] ?? $token->description,
                'region' => $data['region'] ?? null,
                'code'   => $data['status'] ?? null,
            ]];
        });
    }

    /**
     * page_token = cursor ของ get_order_list
     * $filters: q = order_sn (ดึงตรงด้วย get_order_detail ไม่จำกัดช่วงวัน), status = order_status ของ Shopee,
     *           chat = yes|no (ผู้ซื้อเคย/ยังไม่เคยแชทเข้ามาในระบบ)
     */
    public function orders(PlatformAccessTokens $token, ?string $pageToken = null, int $pageSize = 20, array $filters = []): array
    {
        if (!empty($filters['q'])) {
            try {
                $orders = $this->orderDetails($token, [strtoupper($filters['q'])]);
            } catch (\RuntimeException $e) {
                // เลขออเดอร์ที่ไม่มีอยู่ Shopee ตอบเป็น error "the order is not found"
                if (!str_contains($e->getMessage(), 'not found')) throw $e;
                $orders = [];
            }
            $orders = $this->filterChat($orders, $filters['chat'] ?? null);
            return ['orders' => $orders, 'total_count' => count($orders), 'next_page_token' => null];
        }

        $note = 'แสดงออเดอร์ ' . self::ORDER_DAYS . ' วันล่าสุด (Last ' . self::ORDER_DAYS . ' days)';

        if (empty($filters['chat'])) {
            [$orders, $cursor] = $this->orderPage($token, $pageToken, $pageSize, $filters['status'] ?? null);
            return ['orders' => $orders, 'total_count' => null, 'next_page_token' => $cursor, 'note' => $note];
        }

        // Shopee กรองตามผู้ซื้อไม่ได้ — ไล่ทีละหน้าแล้วกรองเอง จนได้ครบ $pageSize หรือครบ CHAT_SCAN_PAGES หน้า
        // ได้เกิน $pageSize ในหน้าสุดท้ายก็ส่งไปทั้งหมด เพราะ cursor ต่อจากหน้าที่ไล่ไปแล้ว
        $orders = [];
        $cursor = $pageToken;
        for ($i = 0; $i < self::CHAT_SCAN_PAGES; $i++) {
            [$page, $cursor] = $this->orderPage($token, $cursor, 50, $filters['status'] ?? null);
            array_push($orders, ...$this->filterChat($page, $filters['chat']));
            if (!$cursor || count($orders) >= $pageSize) break;
        }
        return ['orders' => $orders, 'total_count' => null, 'next_page_token' => $cursor, 'note' => $note];
    }

    /** หนึ่งหน้าของ get_order_list พร้อมรายละเอียด — คืน [orders, cursor หน้าถัดไป (null = หมดแล้ว)] */
    private function orderPage(PlatformAccessTokens $token, ?string $cursor, int $pageSize, ?string $status): array
    {
        $list = $this->call($token, '/api/v2/order/get_order_list', array_filter([
            'time_range_field' => 'create_time',
            'time_from'        => now()->subDays(self::ORDER_DAYS)->timestamp,
            'time_to'          => now()->timestamp,
            'page_size'        => $pageSize,
            'cursor'           => $cursor ?? '',
            'order_status'     => $status,
        ], fn ($v) => $v !== null));

        return [
            $this->orderDetails($token, array_column($list['order_list'] ?? [], 'order_sn')),
            !empty($list['more']) ? ($list['next_cursor'] ?? null) : null,
        ];
    }

    /** $chat: yes = เฉพาะผู้ซื้อที่เคยแชท, no = ยังไม่เคยแชท, null = ทั้งหมด */
    private function filterChat(array $orders, ?string $chat): array
    {
        if (!$chat) return $orders;
        return array_values(array_filter($orders, fn ($o) => ($o['buyer']['chat'] !== null) === ($chat === 'yes')));
    }

    /**
     * page_token = offset (ตอนค้นชื่อเป็น cursor ข้อความของ search_item)
     * $q: ตัวเลขล้วน = item_id (ไม่พบจะค้นเป็นชื่อต่อ เพราะเลข SKU ต่อท้ายชื่อสินค้า), อย่างอื่น = ชื่อสินค้า
     */
    public function products(PlatformAccessTokens $token, ?string $pageToken = null, int $pageSize = 20, ?string $q = null): array
    {
        if ($q !== null && $q !== '' && $pageToken === null && ctype_digit($q)) {
            $products = $this->itemInfo($token, [$q]);
            if ($products) return ['products' => $products, 'total_count' => 1, 'next_page_token' => null];
        }

        if ($q !== null && $q !== '') {
            $list = $this->call($token, '/api/v2/product/search_item', [
                'offset'    => $pageToken ?? '',
                'page_size' => $pageSize,
                'item_name' => $q,
            ]);
            $products = $this->itemInfo($token, $list['item_id_list'] ?? []);
            return [
                'products'        => $products,
                'total_count'     => $list['total_count'] ?? null,
                'next_page_token' => $products && !empty($list['next_offset']) ? (string) $list['next_offset'] : null,
            ];
        }

        $list = $this->call($token, '/api/v2/product/get_item_list', [
            'offset'      => (int) $pageToken,
            'page_size'   => $pageSize,
            'item_status' => ['NORMAL', 'UNLIST'],
        ]);

        return [
            'products'        => $this->itemInfo($token, array_column($list['item'] ?? [], 'item_id')),
            'total_count'     => $list['total_count'] ?? null,
            'next_page_token' => !empty($list['has_next_page']) ? (string) ($list['next_offset'] ?? '') : null,
        ];
    }

    /**
     * รายละเอียดออเดอร์เดียว — รูปแบบเดียวกันทุกแพลตฟอร์ม (null = ไม่พบ)
     * amounts / times เป็นรายการ {label, ...} เพราะแต่ละแพลตฟอร์มแยกยอดเงินไม่เหมือนกัน
     * ข้อมูลผู้รับแพลตฟอร์มปิดบางส่วนมาแล้ว (****) — แสดงตามที่ได้
     */
    public function orderDetail(PlatformAccessTokens $token, string $orderSn): ?array
    {
        $orderSn = strtoupper($orderSn);
        try {
            $detail = $this->call($token, '/api/v2/order/get_order_detail', [
                'order_sn_list'            => $orderSn,
                'response_optional_fields' => 'buyer_user_id,buyer_username,recipient_address,estimated_shipping_fee,note,item_list,pay_time,pickup_done_time,'
                    . 'cancel_by,cancel_reason,buyer_cancel_reason,shipping_carrier,payment_method,total_amount,order_status,currency,create_time,update_time',
            ]);
        } catch (\RuntimeException $e) {
            if (!str_contains($e->getMessage(), 'not found')) throw $e;
            return null;
        }
        $o = $detail['order_list'][0] ?? null;
        if (!$o) return null;

        // เลขพัสดุ / ยอดเงินแยกส่วนลด — ยังไม่มีจนกว่าจะจัดส่ง/ชำระเงิน จึงไม่ถือเป็น error
        $tracking = $this->optional(fn () => $this->call($token, '/api/v2/logistics/get_tracking_number', ['order_sn' => $orderSn]));
        $income   = $this->optional(fn () => $this->call($token, '/api/v2/payment/get_escrow_detail', ['order_sn' => $orderSn]))['order_income'] ?? null;

        $amounts = $income ? [
            ['label' => 'ราคาสินค้า (Subtotal)', 'amount' => (float) $income['order_original_price']],
            ['label' => 'ส่วนลดสินค้า (Item discount)', 'amount' => -((float) $income['seller_discount'] + (float) $income['shopee_discount'])],
            ['label' => 'โค้ดส่วนลดร้าน (Seller voucher)', 'amount' => -(float) $income['voucher_from_seller']],
            ['label' => 'โค้ดส่วนลด Shopee (Shopee voucher)', 'amount' => -(float) $income['voucher_from_shopee']],
            ['label' => 'Shopee Coins', 'amount' => -(float) $income['coins']],
            ['label' => 'ค่าส่งที่ผู้ซื้อจ่าย (Shipping)', 'amount' => (float) $income['buyer_paid_shipping_fee']],
            ['label' => 'ผู้ซื้อชำระ (Buyer paid)', 'amount' => (float) $income['buyer_total_amount'], 'total' => true],
            ['label' => 'ร้านได้รับ (Seller income)', 'amount' => (float) $income['escrow_amount'], 'total' => true],
        ] : [
            ['label' => 'ผู้ซื้อชำระ (Buyer paid)', 'amount' => (float) ($o['total_amount'] ?? 0), 'total' => true],
        ];

        $address = $o['recipient_address'] ?? [];

        return [
            'id'             => $o['order_sn'],
            'status'         => $o['order_status'] ?? null,
            'currency'       => $o['currency'] ?? null,
            'payment_method' => $o['payment_method'] ?? null,
            'times'          => [
                ['label' => 'สั่งซื้อ (Created)', 'ts' => $o['create_time'] ?? null],
                ['label' => 'ชำระเงิน (Paid)', 'ts' => $o['pay_time'] ?? null],
                ['label' => 'ขนส่งรับพัสดุ (Picked up)', 'ts' => $o['pickup_done_time'] ?? null],
                ['label' => 'อัปเดต (Updated)', 'ts' => $o['update_time'] ?? null],
            ],
            'amounts'        => $amounts,
            'shipping'       => [
                'carrier'  => $o['shipping_carrier'] ?? null,
                'tracking' => array_values(array_filter([$tracking['tracking_number'] ?? null])),
            ],
            'recipient'      => [
                'name'    => $address['name'] ?? null,
                'phone'   => $address['phone'] ?? null,
                'address' => $address['full_address'] ?? null,
            ],
            'buyer'          => [
                'id'   => isset($o['buyer_user_id']) ? (string) $o['buyer_user_id'] : null,
                'name' => $o['buyer_username'] ?? null,
                'note' => ($o['message_to_seller'] ?? '') ?: ($o['note'] ?? null),
                'chat' => $this->chatCustomers($token, [$o['buyer_user_id'] ?? null])[(string) ($o['buyer_user_id'] ?? '')] ?? null,
            ],
            'cancel_reason'  => trim(($o['cancel_reason'] ?? '') . (!empty($o['cancel_by']) ? " (โดย {$o['cancel_by']})" : '')) ?: null,
            'items'          => array_map(fn ($it) => [
                'product_id'     => (string) $it['item_id'],
                'sku'            => ($it['model_sku'] ?? '') ?: ($it['item_sku'] ?? null),
                'name'           => $it['item_name'] ?? null,
                'variant'        => $it['model_name'] ?? null,
                'image'          => $it['image_info']['image_url'] ?? null,
                'quantity'       => $it['model_quantity_purchased'] ?? null,
                'unit_price'     => $it['model_discounted_price'] ?? null,
                'original_price' => $it['model_original_price'] ?? null,
            ], $o['item_list'] ?? []),
        ];
    }

    private function optional(callable $fn): array
    {
        try {
            return $fn();
        } catch (\RuntimeException) {
            return [];
        }
    }

    private function orderDetails(PlatformAccessTokens $token, array $orderSns): array
    {
        if (!$orderSns) return [];

        $detail = $this->call($token, '/api/v2/order/get_order_detail', [
            'order_sn_list'            => implode(',', $orderSns),
            'response_optional_fields' => 'buyer_user_id,buyer_username,order_status,total_amount,currency,create_time,item_list',
        ]);
        $details = [];
        foreach ($detail['order_list'] ?? [] as $od) $details[$od['order_sn']] = $od;
        $chats = $this->chatCustomers($token, array_column($details, 'buyer_user_id'));

        // เรียงตามลำดับของ get_order_list และตัดเลขออเดอร์ที่ไม่พบทิ้ง
        return array_values(array_map(fn ($od) => [
            'id'           => $od['order_sn'],
            'status'       => $od['order_status'] ?? null,
            'create_time'  => $od['create_time'] ?? null,
            'total_amount' => $od['total_amount'] ?? null,
            'currency'     => $od['currency'] ?? null,
            'buyer'        => [
                'id'   => isset($od['buyer_user_id']) ? (string) $od['buyer_user_id'] : null,
                'name' => $od['buyer_username'] ?? null,
                'chat' => $chats[(string) ($od['buyer_user_id'] ?? '')] ?? null,
            ],
            'items'        => array_map(fn ($it) => [
                'product_id'   => isset($it['item_id']) ? (string) $it['item_id'] : null,
                'product_name' => $it['item_name'] ?? null,
                'sku_name'     => $it['model_name'] ?? null,
                'quantity'     => $it['model_quantity_purchased'] ?? null,
            ], $od['item_list'] ?? []),
        ], array_filter(array_map(fn ($sn) => $details[$sn] ?? null, $orderSns))));
    }

    /**
     * ผู้ซื้อที่เคยแชทเข้ามาในระบบ — webhook แชท Shopee สร้างลูกค้าด้วย custId = "{buyer_user_id}_{token id}"
     * คืน [buyer_user_id => ['custId', 'name']] เฉพาะคนที่พบ
     */
    private function chatCustomers(PlatformAccessTokens $token, array $buyerIds): array
    {
        $buyerIds = array_unique(array_filter(array_map('strval', $buyerIds)));
        if (!$buyerIds) return [];

        return Customers::query()
            ->whereIn('custId', array_map(fn ($id) => "{$id}_{$token->id}", $buyerIds))
            ->get(['custId', 'custName'])
            ->mapWithKeys(fn ($c) => [strstr($c->custId, '_', true) => ['custId' => $c->custId, 'name' => $c->custName]])
            ->all();
    }

    private function itemInfo(PlatformAccessTokens $token, array $itemIds): array
    {
        if (!$itemIds) return [];

        $info = $this->call($token, '/api/v2/product/get_item_base_info', ['item_id_list' => implode(',', $itemIds)]);
        return array_map(function ($it) {
            $price = $it['price_info'][0] ?? [];
            return [
                'id'          => (string) $it['item_id'],
                'title'       => $it['item_name'] ?? null,
                'status'      => $it['item_status'] ?? null,
                'create_time' => $it['create_time'] ?? null,
                'update_time' => $it['update_time'] ?? null,
                // สินค้าที่มีตัวเลือก (has_model) ราคา/สต็อกอยู่ระดับ model — ไม่แสดงในรายการ
                'sku_count'   => !empty($it['has_model']) ? 'หลายตัวเลือก' : 1,
                'min_price'   => $price['current_price'] ?? null,
                'max_price'   => $price['current_price'] ?? null,
                'currency'    => $price['currency'] ?? null,
                'stock'       => $it['stock_info_v2']['summary_info']['total_available_stock'] ?? null,
            ];
        }, $info['item_list'] ?? []);
    }

    /**
     * เรียก API ระดับร้าน (GET) — sign = HMAC-SHA256(partner_key, partner_id + path + timestamp + access_token + shop_id)
     * $wrapped=false สำหรับ API ที่คืนค่าที่ระดับบนสุด (เช่น get_shop_info) แทนที่จะอยู่ใน response
     */
    private function call(PlatformAccessTokens $token, string $path, array $params = [], bool $wrapped = true): array
    {
        $this->refreshIfExpired($token);

        $timestamp = time();
        $common = [
            'partner_id'   => (int) $token->shopee_partner_id,
            'timestamp'    => $timestamp,
            'access_token' => $token->accessToken,
            'shop_id'      => (int) $token->shopee_shop_id,
            'sign'         => hash_hmac('sha256', $token->shopee_partner_id . $path . $timestamp . $token->accessToken . $token->shopee_shop_id, $token->shopee_partner_key),
        ];

        // Shopee รับ array เป็น key ซ้ำ (item_status=NORMAL&item_status=UNLIST) ไม่ใช่ item_status[0]=...
        $query = http_build_query($common);
        foreach ($params as $k => $v) {
            foreach ((array) $v as $item) $query .= '&' . urlencode($k) . '=' . urlencode((string) $item);
        }

        $json = Http::timeout(20)->get(self::HOST . $path . '?' . $query)->json() ?? [];
        if (!empty($json['error'])) {
            Log::channel('webhook_shopee_new')->error("❌ Shopee API {$path} failed", ['token_id' => $token->id, 'response' => $json]);
            throw new \RuntimeException('Shopee API: ' . ($json['message'] ?? $json['error']));
        }
        return $wrapped ? ($json['response'] ?? []) : $json;
    }

    private function refreshIfExpired(PlatformAccessTokens $token): void
    {
        if ($token->expire_at && Carbon::parse($token->expire_at)->gt(now()->addMinutes(5))) return;
        if (!$token->shopee_refresh_token) throw new \RuntimeException('token ของ Shopee หมดอายุ และไม่มี refresh token');

        $path = '/api/v2/auth/access_token/get';
        $timestamp = time();
        $sign = hash_hmac('sha256', $token->shopee_partner_id . $path . $timestamp, $token->shopee_partner_key);
        $json = Http::timeout(20)->post(self::HOST . $path . '?' . http_build_query([
            'partner_id' => $token->shopee_partner_id,
            'timestamp'  => $timestamp,
            'sign'       => $sign,
        ]), [
            'partner_id'    => (int) $token->shopee_partner_id,
            'shop_id'       => (int) $token->shopee_shop_id,
            'refresh_token' => $token->shopee_refresh_token,
        ])->json() ?? [];

        if (empty($json['access_token'])) {
            Log::channel('webhook_shopee_new')->error('❌ Shopee Token Refresh Failed', ['token_id' => $token->id, 'response' => $json]);
            throw new \RuntimeException('ต่ออายุ token ของ Shopee ไม่สำเร็จ กรุณาเชื่อมร้านใหม่ที่หน้า Auto Access Token');
        }

        $token->update([
            'accessToken'          => $json['access_token'],
            'shopee_refresh_token' => $json['refresh_token'] ?? $token->shopee_refresh_token,
            'expire_at'            => now()->addSeconds($json['expire_in']),
        ]);
    }
}
