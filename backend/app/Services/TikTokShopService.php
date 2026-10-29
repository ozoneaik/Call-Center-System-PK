<?php

namespace App\Services;

use App\Models\PlatformAccessTokens;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * เรียก TikTok Shop Open API (เวอร์ชัน 202309) ด้วย token ที่ได้จากหน้า Auto Access Token
 * ต้องมี tiktok_app_key / tiktok_app_secret / accessToken ใน platform_access_tokens
 */
class TikTokShopService
{
    private const API_BASE  = 'https://open-api.tiktokglobalshop.com';
    private const AUTH_BASE = 'https://auth.tiktok-shops.com';

    /** ร้านที่ token นี้ได้รับอนุญาต — cache ไว้ 1 วัน เพราะ shop_cipher ไม่เปลี่ยน */
    public function shops(PlatformAccessTokens $token): array
    {
        return Cache::remember("tiktok_shops:{$token->id}", now()->addDay(), function () use ($token) {
            $data = $this->call($token, 'GET', '/authorization/202309/shops');
            return array_map(fn ($s) => [
                'id'     => $s['id'] ?? null,
                'name'   => $s['name'] ?? null,
                'region' => $s['region'] ?? null,
                'code'   => $s['code'] ?? null,
                'cipher' => $s['cipher'] ?? null,
            ], $data['shops'] ?? []);
        });
    }

    public function orders(PlatformAccessTokens $token, ?string $pageToken = null, int $pageSize = 20): array
    {
        $data = $this->call($token, 'POST', '/order/202309/orders/search', array_filter([
            'shop_cipher' => $this->shopCipher($token),
            'page_size'   => $pageSize,
            'page_token'  => $pageToken,
            'sort_field'  => 'create_time',
            'sort_order'  => 'DESC',
        ]), new \stdClass());

        $orders = array_map(function ($o) {
            // line_items ของ 202309 แตกเป็น 1 แถวต่อ 1 ชิ้น — รวมตาม sku เพื่อแสดงจำนวน
            $items = [];
            foreach ($o['line_items'] ?? [] as $li) {
                $key = ($li['product_id'] ?? '') . ':' . ($li['sku_id'] ?? '');
                $items[$key] ??= [
                    'product_id'   => $li['product_id'] ?? null,
                    'product_name' => $li['product_name'] ?? null,
                    'sku_name'     => $li['sku_name'] ?? null,
                    'quantity'     => 0,
                ];
                $items[$key]['quantity']++;
            }
            return [
                'id'           => $o['id'] ?? null,
                'status'       => $o['status'] ?? null,
                'create_time'  => $o['create_time'] ?? null,
                'total_amount' => $o['payment']['total_amount'] ?? null,
                'currency'     => $o['payment']['currency'] ?? null,
                'items'        => array_values($items),
            ];
        }, $data['orders'] ?? []);

        return [
            'orders'          => $orders,
            'total_count'     => $data['total_count'] ?? count($orders),
            'next_page_token' => $data['next_page_token'] ?? null,
        ];
    }

    public function products(PlatformAccessTokens $token, ?string $pageToken = null, int $pageSize = 20): array
    {
        $data = $this->call($token, 'POST', '/product/202309/products/search', array_filter([
            'shop_cipher' => $this->shopCipher($token),
            'page_size'   => $pageSize,
            'page_token'  => $pageToken,
        ]), ['status' => 'ALL']);

        $products = array_map(function ($p) {
            $skus   = $p['skus'] ?? [];
            $prices = array_filter(array_map(fn ($s) => $s['price']['sale_price'] ?? $s['price']['tax_exclusive_price'] ?? null, $skus), 'is_numeric');
            $stock  = 0;
            foreach ($skus as $s) {
                foreach ($s['inventory'] ?? [] as $inv) $stock += (int) ($inv['quantity'] ?? 0);
            }
            return [
                'id'          => $p['id'] ?? null,
                'title'       => $p['title'] ?? null,
                'status'      => $p['status'] ?? null,
                'create_time' => $p['create_time'] ?? null,
                'update_time' => $p['update_time'] ?? null,
                'sku_count'   => count($skus),
                'min_price'   => $prices ? min($prices) : null,
                'max_price'   => $prices ? max($prices) : null,
                'currency'    => $skus[0]['price']['currency'] ?? null,
                'stock'       => $stock,
            ];
        }, $data['products'] ?? []);

        return [
            'products'        => $products,
            'total_count'     => $data['total_count'] ?? count($products),
            'next_page_token' => $data['next_page_token'] ?? null,
        ];
    }

    private function shopCipher(PlatformAccessTokens $token): string
    {
        $cipher = $this->shops($token)[0]['cipher'] ?? null;
        if (!$cipher) throw new \RuntimeException('ไม่พบร้านค้าที่ได้รับอนุญาตสำหรับ token นี้');
        return $cipher;
    }

    /** เรียก API พร้อมเซ็น — คืนค่าเฉพาะส่วน data, โยน exception ถ้า code != 0 */
    private function call(PlatformAccessTokens $token, string $method, string $path, array $query = [], $body = null): array
    {
        $this->refreshIfExpired($token);

        $query = array_merge($query, [
            'app_key'   => $token->tiktok_app_key,
            'timestamp' => time(),
        ]);
        $bodyJson = $body === null ? '' : json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $query['sign'] = $this->sign($path, $query, $bodyJson, $token->tiktok_app_secret);

        $request = Http::withHeaders(['x-tts-access-token' => $token->accessToken])->timeout(20);
        $url = self::API_BASE . $path . '?' . http_build_query($query);
        $resp = ($method === 'GET'
            ? $request->get($url)
            : $request->withBody($bodyJson, 'application/json')->send($method, $url)
        )->json();

        if (($resp['code'] ?? -1) !== 0) {
            Log::channel('webhook_tiktok_new')->error("❌ TikTok API {$path} failed", ['token_id' => $token->id, 'response' => $resp]);
            throw new \RuntimeException('TikTok API: ' . ($resp['message'] ?? 'ไม่ทราบสาเหตุ') . ' (code ' . ($resp['code'] ?? '-') . ')');
        }
        return $resp['data'] ?? [];
    }

    /** sign = HMAC-SHA256(secret, secret + path + key1value1... + body + secret) โดยไม่รวม sign / access_token */
    private function sign(string $path, array $query, string $body, string $secret): string
    {
        unset($query['sign'], $query['access_token']);
        ksort($query);
        $str = $path;
        foreach ($query as $k => $v) $str .= $k . $v;
        $str .= $body;
        return hash_hmac('sha256', $secret . $str . $secret, $secret);
    }

    /** access token ของ TikTok อายุสั้น — ต่ออายุด้วย refresh token เมื่อใกล้หมด */
    private function refreshIfExpired(PlatformAccessTokens $token): void
    {
        if (!$token->expire_at || Carbon::parse($token->expire_at)->gt(now()->addMinutes(10)) || !$token->tiktok_refresh_token) {
            return;
        }

        $resp = Http::timeout(20)->get(self::AUTH_BASE . '/api/v2/token/refresh', [
            'app_key'       => $token->tiktok_app_key,
            'app_secret'    => $token->tiktok_app_secret,
            'refresh_token' => $token->tiktok_refresh_token,
            'grant_type'    => 'refresh_token',
        ])->json();

        if (empty($resp['data']['access_token'])) {
            Log::channel('webhook_tiktok_new')->error('❌ TikTok Token Refresh Failed', ['token_id' => $token->id, 'response' => $resp]);
            throw new \RuntimeException('ต่ออายุ token ของ TikTok ไม่สำเร็จ กรุณาเชื่อมร้านใหม่ที่หน้า Auto Access Token');
        }

        $token->update([
            'accessToken'          => $resp['data']['access_token'],
            'tiktok_refresh_token' => $resp['data']['refresh_token'] ?? $token->tiktok_refresh_token,
            'expire_at'            => Carbon::createFromTimestamp($resp['data']['access_token_expire_in']),
        ]);
        Log::channel('webhook_tiktok_new')->info('🔄 TikTok Token Refreshed', ['token_id' => $token->id]);
    }
}
