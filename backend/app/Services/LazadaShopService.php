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

    /** page_token = offset */
    public function orders(PlatformAccessTokens $token, ?string $pageToken = null, int $pageSize = 20): array
    {
        $offset = (int) $pageToken;
        $data = $this->call($token, '/orders/get', [
            'created_after'  => now()->subDays(self::ORDER_DAYS)->toIso8601String(),
            'sort_by'        => 'created_at',
            'sort_direction' => 'DESC',
            'offset'         => $offset,
            'limit'          => $pageSize,
        ]);
        $list = $data['orders'] ?? [];

        // รายการสินค้าในออเดอร์ต้องเรียกแยกที่ /orders/items/get
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

        $orders = array_map(fn ($o) => [
            'id'           => (string) $o['order_id'],
            'status'       => strtoupper($o['statuses'][0] ?? '-'),
            'create_time'  => isset($o['created_at']) ? strtotime($o['created_at']) : null,
            'total_amount' => (float) ($o['price'] ?? 0) + (float) ($o['shipping_fee'] ?? 0),
            'currency'     => 'THB',
            'items'        => $itemsByOrder[$o['order_id']] ?? [],
        ], $list);

        $total = (int) ($data['countTotal'] ?? $data['count'] ?? 0);
        return [
            'orders'          => $orders,
            'total_count'     => $total,
            'next_page_token' => $offset + count($list) < $total ? (string) ($offset + count($list)) : null,
            'note'            => 'แสดงออเดอร์ ' . self::ORDER_DAYS . ' วันล่าสุด (Last ' . self::ORDER_DAYS . ' days)',
        ];
    }

    /** page_token = offset */
    public function products(PlatformAccessTokens $token, ?string $pageToken = null, int $pageSize = 20): array
    {
        $offset = (int) $pageToken;
        $data = $this->call($token, '/products/get', ['filter' => 'all', 'offset' => $offset, 'limit' => $pageSize]);
        $list = $data['products'] ?? [];

        $products = array_map(function ($p) {
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
        }, $list);

        $total = (int) ($data['total_products'] ?? 0);
        return [
            'products'        => $products,
            'total_count'     => $total,
            'next_page_token' => $offset + count($list) < $total ? (string) ($offset + count($list)) : null,
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
            throw new \RuntimeException('Lazada API: ' . ($resp['message'] ?? 'ไม่ทราบสาเหตุ') . ' (' . ($resp['code'] ?? '-') . ')');
        }
        return $resp['data'] ?? [];
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
