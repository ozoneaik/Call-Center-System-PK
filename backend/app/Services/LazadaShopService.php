<?php

namespace App\Services;

use App\Models\PlatformAccessTokens;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Lazada\LazopClient;
use Lazada\LazopRequest;

/**
 * เรียก Lazada Open Platform API (ประเทศไทย) ด้วย token ใน platform_access_tokens
 * คืนข้อมูลรูปแบบเดียวกับ TikTokShopService เพื่อใช้หน้าแสดงผลร่วมกัน
 */
class LazadaShopService
{
    private const API_URL = 'https://api.lazada.co.th/rest';

    /** /orders/get ต้องระบุ created_after — ดึงย้อนหลังตามจำนวนวันนี้ */
    public const ORDER_DAYS = 30;

    /** code ที่ Lazada ตอบเมื่อค้นด้วยเลขที่ไม่มีอยู่ — E016 Invalid Order ID, E207 SKU not exist */
    private const NOT_FOUND_CODES = [16, 207];

    public function shops(PlatformAccessTokens $token): array
    {
        return Cache::remember("lazada_shops:{$token->id}", now()->addDay(), function () use ($token) {
            // app บางตัวไม่มีสิทธิ์ /seller/get (InsufficientPermission) — ใช้ข้อมูลที่บันทึกไว้แทน
            try {
                $data = $this->call($token, '/seller/get');
            } catch (\RuntimeException) {
                $data = [];
            }
            return [[
                'id'     => (string) ($data['seller_id'] ?? $token->laz_seller_id),
                'name'   => $data['name'] ?? $token->description,
                'region' => $data['location'] ?? 'TH',
                'code'   => $data['short_code'] ?? null,
            ]];
        });
    }

    /**
     * page_token = offset
     * $filters: q = order_id (ดึงตรงด้วย /order/get ไม่จำกัดช่วงวัน), status = status ของ Lazada (ตัวพิมพ์เล็ก)
     */
    public function orders(PlatformAccessTokens $token, ?string $pageToken = null, int $pageSize = 20, array $filters = []): array
    {
        if (!empty($filters['q'])) {
            $order  = $this->find(fn () => $this->call($token, '/order/get', ['order_id' => $filters['q']]));
            $orders = empty($order['order_id']) ? [] : $this->mapOrders($token, [$order]);
            return ['orders' => $orders, 'total_count' => count($orders), 'next_page_token' => null];
        }

        $offset = (int) $pageToken;
        $data = $this->call($token, '/orders/get', array_filter([
            'created_after'  => now()->subDays(self::ORDER_DAYS)->toIso8601String(),
            'sort_by'        => 'created_at',
            'sort_direction' => 'DESC',
            'offset'         => $offset,
            'limit'          => $pageSize,
            'status'         => $filters['status'] ?? null,
        ], fn ($v) => $v !== null));
        $list = $data['orders'] ?? [];

        $total = (int) ($data['countTotal'] ?? $data['count'] ?? 0);
        return [
            'orders'          => $this->mapOrders($token, $list),
            'total_count'     => $total,
            'next_page_token' => $offset + count($list) < $total ? (string) ($offset + count($list)) : null,
            'note'            => 'แสดงออเดอร์ ' . self::ORDER_DAYS . ' วันล่าสุด (Last ' . self::ORDER_DAYS . ' days)',
        ];
    }

    /**
     * page_token = offset
     * $q: ตัวเลขล้วน = item_id (ไม่พบจะค้นเป็น seller SKU ต่อ), อย่างอื่น = seller SKU
     * (พารามิเตอร์ search ของ /products/get ไม่มีผลกับ app นี้ จึงค้นด้วยชื่อสินค้าไม่ได้)
     */
    public function products(PlatformAccessTokens $token, ?string $pageToken = null, int $pageSize = 20, ?string $q = null): array
    {
        if ($q !== null && $q !== '' && $pageToken === null && ctype_digit($q)) {
            $p = $this->find(fn () => $this->call($token, '/product/item/get', ['item_id' => $q]));
            if (!empty($p['item_id'])) return ['products' => [$this->mapProduct($p)], 'total_count' => 1, 'next_page_token' => null];
        }

        $offset = (int) $pageToken;
        $data = $this->call($token, '/products/get', array_filter([
            'filter'          => 'all',
            'offset'          => $offset,
            'limit'           => $pageSize,
            'sku_seller_list' => $q !== null && $q !== '' ? json_encode([$q]) : null,
        ], fn ($v) => $v !== null));
        $list = $data['products'] ?? [];

        $total = (int) ($data['total_products'] ?? 0);
        return [
            'products'        => array_map(fn ($p) => $this->mapProduct($p), $list),
            'total_count'     => $total,
            'next_page_token' => $offset + count($list) < $total ? (string) ($offset + count($list)) : null,
        ];
    }

    /**
     * รายละเอียดออเดอร์เดียว — รูปแบบเดียวกันทุกแพลตฟอร์ม (null = ไม่พบ)
     * amounts / times เป็นรายการ {label, ...} เพราะแต่ละแพลตฟอร์มแยกยอดเงินไม่เหมือนกัน
     * ข้อมูลผู้รับแพลตฟอร์มปิดบางส่วนมาแล้ว (****) — แสดงตามที่ได้
     */
    public function orderDetail(PlatformAccessTokens $token, string $orderId): ?array
    {
        $o = $this->find(fn () => $this->call($token, '/order/get', ['order_id' => $orderId]));
        if (empty($o['order_id'])) return null;
        $lines = $this->call($token, '/order/items/get', ['order_id' => $orderId]);

        // order item ของ Lazada เป็น 1 แถวต่อ 1 ชิ้น — รวมตาม sku
        $items = [];
        foreach ($lines as $it) {
            $key = $it['sku'] ?? $it['shop_sku'] ?? $it['name'];
            $items[$key] ??= [
                'product_id'     => isset($it['product_id']) ? (string) $it['product_id'] : null,
                'sku'            => $it['sku'] ?? null,
                'name'           => $it['name'] ?? null,
                'variant'        => $it['variation'] ?? null,
                'image'          => $it['product_main_image'] ?? null,
                'quantity'       => 0,
                'unit_price'     => $it['paid_price'] ?? null,
                'original_price' => $it['item_price'] ?? null,
            ];
            $items[$key]['quantity']++;
        }

        $address  = $o['address_shipping'] ?? [];
        $ts       = fn ($date) => $date ? strtotime($date) : null;
        $first    = $lines[0] ?? [];
        $shipDisc = (float) ($o['shipping_fee_discount_platform'] ?? 0) + (float) ($o['shipping_fee_discount_seller'] ?? 0);

        return [
            'id'             => (string) $o['order_id'],
            'status'         => strtoupper($o['statuses'][0] ?? '-'),
            'currency'       => 'THB',
            'payment_method' => $o['payment_method'] ?? null,
            'times'          => [
                ['label' => 'สั่งซื้อ (Created)', 'ts' => $ts($o['created_at'] ?? null)],
                // payment_time ของ order item เป็น millisecond
                ['label' => 'ชำระเงิน (Paid)', 'ts' => !empty($first['payment_time']) ? intdiv((int) $first['payment_time'], 1000) : null],
                ['label' => 'อัปเดต (Updated)', 'ts' => $ts($o['updated_at'] ?? null)],
            ],
            'amounts'        => [
                ['label' => 'ราคาสินค้า (Subtotal)', 'amount' => (float) ($o['price'] ?? 0)],
                ['label' => 'ค่าส่ง (Shipping)', 'amount' => (float) ($o['shipping_fee_original'] ?? $o['shipping_fee'] ?? 0)],
                ['label' => 'ส่วนลดค่าส่ง (Shipping discount)', 'amount' => -$shipDisc],
                ['label' => 'ส่วนลด / Voucher', 'amount' => -(float) ($o['voucher'] ?? 0)],
                ['label' => 'ผู้ซื้อชำระ (Buyer paid)', 'amount' => round((float) ($o['price'] ?? 0) + (float) ($o['shipping_fee'] ?? 0) - (float) ($o['voucher'] ?? 0), 2), 'total' => true],
            ],
            'shipping'       => [
                'carrier'  => $first['shipment_provider'] ?? null,
                'tracking' => array_values(array_unique(array_filter(array_column($lines, 'tracking_code')))),
            ],
            'recipient'      => [
                'name'    => trim(($address['first_name'] ?? '') . ' ' . ($address['last_name'] ?? '')) ?: null,
                'phone'   => $address['phone'] ?? null,
                'address' => implode(' ', array_filter([
                    $address['address1'] ?? null, $address['address2'] ?? null,
                    $address['addressDistrict'] ?? null, $address['city'] ?? null, $address['post_code'] ?? null,
                ])) ?: null,
            ],
            'buyer'          => [
                'name' => trim(($o['customer_first_name'] ?? '') . ' ' . ($o['customer_last_name'] ?? '')) ?: null,
                'note' => ($o['buyer_note'] ?? '') ?: (($o['remarks'] ?? '') ?: (($o['gift_message'] ?? '') ?: null)),
            ],
            'cancel_reason'  => implode(', ', array_unique(array_filter(array_column($lines, 'reason')))) ?: null,
            'items'          => array_values($items),
        ];
    }

    /** รายการสินค้าในออเดอร์ต้องเรียกแยกที่ /orders/items/get */
    private function mapOrders(PlatformAccessTokens $token, array $list): array
    {
        $itemsByOrder = [];
        if ($list) {
            $items = $this->call($token, '/orders/items/get', ['order_ids' => json_encode(array_column($list, 'order_id'))]);
            foreach ($items as $o) {
                $grouped = [];
                foreach ($o['order_items'] ?? [] as $it) {
                    $key = $it['sku'] ?? $it['shop_sku'] ?? $it['name'];
                    $grouped[$key] ??= [
                        'product_id'   => isset($it['product_id']) ? (string) $it['product_id'] : ($it['shop_sku'] ?? null),
                        'product_name' => $it['name'] ?? null,
                        'sku_name'     => $it['variation'] ?? null,
                        'quantity'     => 0,
                    ];
                    $grouped[$key]['quantity']++;
                }
                $itemsByOrder[$o['order_id']] = array_values($grouped);
            }
        }

        return array_map(fn ($o) => [
            'id'           => (string) $o['order_id'],
            'status'       => strtoupper($o['statuses'][0] ?? '-'),
            'create_time'  => isset($o['created_at']) ? strtotime($o['created_at']) : null,
            // price = ราคาสินค้าก่อนส่วนลด, voucher = ส่วนลดรวม → ยอดที่ผู้ซื้อจ่ายจริง
            'total_amount' => round((float) ($o['price'] ?? 0) + (float) ($o['shipping_fee'] ?? 0) - (float) ($o['voucher'] ?? 0), 2),
            'currency'     => 'THB',
            'items'        => $itemsByOrder[$o['order_id']] ?? [],
        ], $list);
    }

    private function mapProduct(array $p): array
    {
        $skus   = $p['skus'] ?? [];
        $prices = array_filter(array_map(fn ($s) => !empty($s['special_price']) ? $s['special_price'] : ($s['price'] ?? null), $skus), 'is_numeric');
        return [
            'id'          => (string) $p['item_id'],
            'title'       => $p['attributes']['name'] ?? null,
            'status'      => strtoupper($p['status'] ?? '-'),
            // Lazada ให้เวลาเป็น millisecond
            'create_time' => isset($p['created_time']) ? intdiv((int) $p['created_time'], 1000) : null,
            'update_time' => isset($p['updated_time']) ? intdiv((int) $p['updated_time'], 1000) : null,
            'sku_count'   => count($skus),
            'min_price'   => $prices ? min($prices) : null,
            'max_price'   => $prices ? max($prices) : null,
            'currency'    => 'THB',
            'stock'       => array_sum(array_map(fn ($s) => (int) ($s['quantity'] ?? 0), $skus)),
        ];
    }

    /**
     * เรียก API ด้วย LazopClient (เซ็นให้เอง) — คืนค่าเฉพาะส่วน data, โยน exception ถ้า code != 0
     * ไม่เชื่อ expire_at ในฐานข้อมูล (มีโค้ดเดิมที่เขียนทับเป็นเวลาปัจจุบันตอน refresh ไม่สำเร็จ)
     * จึงยิงด้วย token เดิมก่อน แล้วค่อย refresh เมื่อ Lazada ตอบว่า token ใช้ไม่ได้
     */
    private function call(PlatformAccessTokens $token, string $path, array $params = [], bool $retried = false): array
    {
        $client  = new LazopClient(self::API_URL, $token->laz_app_key, $token->laz_app_secret);
        $request = new LazopRequest($path, 'GET');
        foreach ($params as $k => $v) $request->addApiParam($k, (string) $v);

        $resp = json_decode($client->execute($request, $token->accessToken), true) ?? [];
        if (!$retried && in_array($resp['code'] ?? '', ['IllegalAccessToken', 'MissingAccessToken'], true)) {
            $this->refresh($token);
            return $this->call($token, $path, $params, true);
        }
        if ((string) ($resp['code'] ?? '') !== '0') {
            Log::channel('webhook_lazada_new')->error("❌ Lazada API {$path} failed", ['token_id' => $token->id, 'response' => $resp]);
            $code = $resp['code'] ?? '-';
            throw new \RuntimeException('Lazada API: ' . ($resp['message'] ?? 'ไม่ทราบสาเหตุ') . " ({$code})", is_numeric($code) ? (int) $code : 0);
        }
        return $resp['data'] ?? [];
    }

    /** ค้นด้วยเลข order / item — ไม่พบให้คืน [] แทน error */
    private function find(callable $fn): array
    {
        try {
            return $fn();
        } catch (\RuntimeException $e) {
            if (!in_array($e->getCode(), self::NOT_FOUND_CODES, true)) throw $e;
            return [];
        }
    }

    private function refresh(PlatformAccessTokens $token): void
    {
        if (!$token->laz_refresh_token) throw new \RuntimeException('token ของ Lazada หมดอายุ และไม่มี refresh token');

        $params = [
            'app_key'       => $token->laz_app_key,
            'refresh_token' => $token->laz_refresh_token,
            'timestamp'     => round(microtime(true) * 1000),
            'sign_method'   => 'sha256',
        ];
        ksort($params);
        $signStr = '/auth/token/refresh';
        foreach ($params as $k => $v) $signStr .= $k . $v;
        $params['sign'] = strtoupper(hash_hmac('sha256', $signStr, $token->laz_app_secret));

        $json = Http::asForm()->timeout(20)->post('https://auth.lazada.com/rest/auth/token/refresh', $params)->json() ?? [];
        if (empty($json['access_token'])) {
            Log::channel('webhook_lazada_new')->error('❌ Lazada Token Refresh Failed', ['token_id' => $token->id, 'response' => $json]);
            throw new \RuntimeException('ต่ออายุ token ของ Lazada ไม่สำเร็จ กรุณาเชื่อมร้านใหม่ที่หน้า Auto Access Token');
        }

        $token->update([
            'accessToken'       => $json['access_token'],
            'laz_refresh_token' => $json['refresh_token'] ?? $token->laz_refresh_token,
            'expire_at'         => now()->addSeconds($json['expires_in'] ?? 0),
            'laz_seller_id'     => $json['country_user_info'][0]['seller_id'] ?? $token->laz_seller_id,
        ]);
    }
}
