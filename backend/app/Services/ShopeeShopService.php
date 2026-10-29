<?php

namespace App\Services;

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

    /** page_token = cursor ของ get_order_list */
    public function orders(PlatformAccessTokens $token, ?string $pageToken = null, int $pageSize = 20): array
    {
        $list = $this->call($token, '/api/v2/order/get_order_list', [
            'time_range_field' => 'create_time',
            'time_from'        => now()->subDays(self::ORDER_DAYS)->timestamp,
            'time_to'          => now()->timestamp,
            'page_size'        => $pageSize,
            'cursor'           => $pageToken ?? '',
        ]);
        $orderSns = array_column($list['order_list'] ?? [], 'order_sn');

        $details = [];
        if ($orderSns) {
            $detail = $this->call($token, '/api/v2/order/get_order_detail', [
                'order_sn_list'            => implode(',', $orderSns),
                'response_optional_fields' => 'order_status,total_amount,currency,create_time,item_list',
            ]);
            foreach ($detail['order_list'] ?? [] as $od) $details[$od['order_sn']] = $od;
        }

        $orders = array_map(function ($sn) use ($details) {
            $od = $details[$sn] ?? [];
            return [
                'id'           => $sn,
                'status'       => $od['order_status'] ?? null,
                'create_time'  => $od['create_time'] ?? null,
                'total_amount' => $od['total_amount'] ?? null,
                'currency'     => $od['currency'] ?? null,
                'items'        => array_map(fn ($it) => [
                    'product_id'   => isset($it['item_id']) ? (string) $it['item_id'] : null,
                    'product_name' => $it['item_name'] ?? null,
                    'sku_name'     => $it['model_name'] ?? null,
                    'quantity'     => $it['model_quantity_purchased'] ?? null,
                ], $od['item_list'] ?? []),
            ];
        }, $orderSns);

        return [
            'orders'          => $orders,
            'total_count'     => null,
            'next_page_token' => !empty($list['more']) ? ($list['next_cursor'] ?? null) : null,
            'note'            => 'แสดงออเดอร์ ' . self::ORDER_DAYS . ' วันล่าสุด (Last ' . self::ORDER_DAYS . ' days)',
        ];
    }

    /** page_token = offset ของ get_item_list */
    public function products(PlatformAccessTokens $token, ?string $pageToken = null, int $pageSize = 20): array
    {
        $list = $this->call($token, '/api/v2/product/get_item_list', [
            'offset'      => (int) $pageToken,
            'page_size'   => $pageSize,
            'item_status' => ['NORMAL', 'UNLIST'],
        ]);
        $itemIds = array_column($list['item'] ?? [], 'item_id');

        $products = [];
        if ($itemIds) {
            $info = $this->call($token, '/api/v2/product/get_item_base_info', ['item_id_list' => implode(',', $itemIds)]);
            foreach ($info['item_list'] ?? [] as $it) {
                $price = $it['price_info'][0] ?? [];
                $products[] = [
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
            }
        }

        return [
            'products'        => $products,
            'total_count'     => $list['total_count'] ?? count($products),
            'next_page_token' => !empty($list['has_next_page']) ? (string) ($list['next_offset'] ?? '') : null,
        ];
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
