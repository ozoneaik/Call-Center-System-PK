<?php

namespace App\Http\Controllers;

use App\Models\ChatRooms;
use App\Models\PlatformAccessTokens;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PlatformTokenController extends Controller
{
    public function listRooms()
    {
        try {
            $chatRooms = ChatRooms::query()
                ->where('is_active', true)
                ->get();

            return response()->json([
                'status' => true,
                'chat_rooms' => $chatRooms
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'chat_rooms' => [],
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // ---------------- SHOPEE ----------------
    public function shopeeExchange(Request $req)
    {
        $code       = $req->input('code');
        $shopId     = $req->input('shop_id');
        $partnerId  = $req->input('partner_id');
        $partnerKey = trim($req->input('partner_key'));
        $redirect   = $req->input('callback_url');
        $roomId     = $req->input('room_default_id');
        $usageType  = $req->input('usage_type'); 
        $description = $req->input('description');

        if (!$code || !$shopId || !$partnerId || !$partnerKey || !$redirect) {
            return response()->json(
                ['error' => 'missing required params'],
                422,
                [],
                JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
            );
        }

        $timestamp = time();
        $host      = "https://partner.shopeemobile.com";
        $path      = "/api/v2/auth/token/get";

        $baseString = $partnerId . $path . $timestamp;
        $sign = hash_hmac('sha256', $baseString, $partnerKey);

        $url = "{$host}{$path}?partner_id={$partnerId}&timestamp={$timestamp}&sign={$sign}";

        $body = [
            "code"       => $code,
            "shop_id"    => (int)$shopId,
            "partner_id" => (int)$partnerId,
        ];

        $resp = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post($url, $body);

        $rawBody = $resp->body();
        $json    = json_decode($rawBody, true);

        Log::channel('webhook_shopee_new')->info(
            "📥 Shopee Exchange Response\n" .
                json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );
        if (!empty($json['access_token'])) {
            $platforms = PlatformAccessTokens::where('platform', 'shopee')
                ->where('shopee_shop_id', $shopId)
                ->get();

            if ($platforms->isEmpty()) {
                PlatformAccessTokens::create([
                    'accessTokenId'        => uniqid("shp_", true),
                    'accessToken'          => $json['access_token'],
                    'description'          => $req->input('description'),
                    'platform'             => 'shopee',
                    'room_default_id'      => $roomId,
                    'shopee_refresh_token' => $json['refresh_token'],
                    'expire_at'            => Carbon::now()->addSeconds($json['expire_in']),
                    'shopee_partner_id'    => $partnerId,
                    'shopee_partner_key'   => $partnerKey,
                    'shopee_code'          => $code,
                    'usage_type'           => $usageType,
                    'shopee_shop_id'       => $shopId,
                ]);
            } else {
                $target = $platforms->firstWhere('usage_type', $usageType);

                if (!$target) {
                    $noUsageType = $platforms->firstWhere('usage_type', null);
                    if ($noUsageType) {
                        $target = $noUsageType;
                    } else {
                        $target = new PlatformAccessTokens();
                    }
                }
                $target->fill([
                    'accessTokenId'        => uniqid("shp_", true),
                    'accessToken'          => $json['access_token'],
                    'description'          => $req->input('description'),
                    'platform'             => 'shopee',
                    'room_default_id'      => $roomId,
                    'shopee_refresh_token' => $json['refresh_token'],
                    'expire_at'            => Carbon::now()->addSeconds($json['expire_in']),
                    'shopee_partner_id'    => $partnerId,
                    'shopee_partner_key'   => $partnerKey,
                    'shopee_code'          => $code,
                    'usage_type'           => $usageType,
                    'shopee_shop_id'       => $shopId,
                ])->save();
            }
        }

        return response()->json(
            array_merge($json, [
                'usage_type'  => $usageType,
                'description' => $description,
                'shop_id'     => $shopId,
            ]),
            $resp->status(),
            [],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
        );
    }

    public function shopeeAuthUrl(Request $req)
    {
        $partnerId  = $req->input('partner_id');
        $partnerKey = $req->input('partner_key');
        $redirect   = $req->input('callback_url');

        if (empty($partnerId) || empty($partnerKey) || empty($redirect)) {
            return response()->json(['error' => 'ต้องกรอก partner_id, partner_key และ callback_url'], 422);
        }

        $timestamp = time();
        $path      = "/api/v2/shop/auth_partner";
        $baseStr   = $partnerId . $path . $timestamp;
        $sign      = hash_hmac('sha256', $baseStr, $partnerKey);

        $url = "https://partner.shopeemobile.com{$path}?" . http_build_query([
            'partner_id' => $partnerId,
            'timestamp'  => $timestamp,
            'sign'       => $sign,
            'redirect'   => $redirect,
        ]);

        return response()->json(['auth_url' => $url]);
    }


    public function shopeeCallback(Request $request)
    {
        $code   = $request->query('code');
        $shopId = $request->query('shop_id');

        if (!$code || !$shopId) {
            return response()->json(['error' => 'Missing code or shop_id'], 422);
        }
        $frontendUrl = "https://dev2.pumpkin-th.com/TokenManager";
        return redirect()->away("{$frontendUrl}?code={$code}&shop_id={$shopId}&platform=shopee");
    }

    public function shopeeRefresh(Request $req)
    {
        $shopId = $req->input('shop_id');
        if (!$shopId) {
            return response()->json(['error' => 'missing shop_id'], 422);
        }

        $platform = PlatformAccessTokens::where('platform', 'shopee')
            ->where('shopee_shop_id', $shopId)
            ->first();

        if (!$platform) {
            return response()->json(['error' => 'ไม่พบข้อมูล token สำหรับ shop_id นี้'], 404);
        }

        $partnerId  = $platform->shopee_partner_id;
        $partnerKey = $platform->shopee_partner_key;
        $refreshTok = $platform->shopee_refresh_token;

        if (!$partnerId || !$partnerKey || !$refreshTok) {
            return response()->json(['error' => 'ข้อมูลไม่ครบ ไม่สามารถ refresh token ได้'], 422);
        }

        $timestamp = time();
        $host      = "https://partner.shopeemobile.com";
        $path      = "/api/v2/auth/access_token/get";

        $baseString = $partnerId . $path . $timestamp;
        $sign = hash_hmac('sha256', $baseString, $partnerKey);

        $url = "{$host}{$path}?partner_id={$partnerId}&timestamp={$timestamp}&sign={$sign}";

        $body = [
            "refresh_token" => $refreshTok,
            "partner_id"    => (int)$partnerId,
            "shop_id"       => (int)$shopId,
        ];

        $resp = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post($url, $body);

        $rawBody = $resp->body();
        $json    = json_decode($rawBody, true);

        Log::channel('webhook_shopee_new')->info(
            "♻️ Shopee Refresh Response\n" .
                json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );

        if (!empty($json['access_token'])) {
            $platform->update([
                'accessToken'          => $json['access_token'],
                'shopee_refresh_token' => $json['refresh_token'] ?? $refreshTok,
                'expire_at'            => Carbon::now()->addSeconds($json['expire_in']),
            ]);
        }

        return response()->json($json, $resp->status(), [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    // ---------------- LAZADA ----------------
    public function lazadaAuthUrl(Request $req)
    {
        $appKey   = $req->input('partner_id');
        $redirect = $req->input('callback_url');

        if (empty($appKey) || empty($redirect)) {
            return response()->json(['error' => 'ต้องกรอก app_key และ callback_url'], 422);
        }

        $url = "https://auth.lazada.com/oauth/authorize?" . http_build_query([
            'response_type' => 'code',
            'force_auth'    => 'true',
            'redirect_uri'  => $redirect,
            'client_id'     => $appKey,
        ]);

        return response()->json(['auth_url' => $url]);
    }

    public function lazadaCallback(Request $request)
    {
        $code = $request->query('code');
        if (!$code) {
            return response()->json(['error' => 'Missing code'], 422);
        }
        $frontendUrl = "https://dev2.pumpkin-th.com/TokenManager";
        return redirect()->away("{$frontendUrl}?code={$code}&platform=lazada");
    }

    public function lazadaExchange(Request $req)
    {
        $code      = $req->input('code');
        $appKey    = $req->input('partner_id');
        $appSecret = $req->input('partner_key');
        $redirect  = $req->input('callback_url');
        $roomId    = $req->input('room_default_id');

        if (!$code || !$appKey || !$appSecret || !$redirect) {
            return response()->json(['error' => 'missing required params'], 422);
        }

        $host      = "https://auth.lazada.com/rest";
        $apiPath   = "/auth/token/create";
        $timestamp = round(microtime(true) * 1000);

        $params = [
            'app_key'     => $appKey,
            'code'        => $code,
            'timestamp'   => $timestamp,
            'sign_method' => 'sha256',
        ];

        ksort($params);
        $signString = $apiPath;
        foreach ($params as $key => $value) {
            $signString .= $key . $value;
        }
        $sign = strtoupper(hash_hmac('sha256', $signString, $appSecret));
        $params['sign'] = $sign;

        $resp = Http::asForm()->post($host . $apiPath, $params)->json();
        Log::info("Lazada Exchange Response", $resp);

        if (!empty($resp['access_token'])) {
            $sellerId = null;
            if (!empty($resp['country_user_info']) && is_array($resp['country_user_info'])) {
                $sellerId = $resp['country_user_info'][0]['seller_id'] ?? null;
            }
            $saved = PlatformAccessTokens::updateOrCreate(
                [
                    'platform'      => 'lazada',
                    'laz_app_key'   => $appKey,
                    'laz_seller_id' => $sellerId,
                ],
                [
                    'accessTokenId'  => uniqid("laz_", true),
                    'accessToken'    => $resp['access_token'],
                    'description'    => $req->input('description'),
                    'platform'       => 'lazada',
                    'room_default_id' => $roomId,
                    'laz_app_key'    => $appKey,
                    'laz_app_secret' => $appSecret,
                    'laz_seller_id'  => $sellerId,
                    'expire_at'      => Carbon::now()->addSeconds($resp['expires_in'] ?? 0),
                ]
            );
            Log::info("✅ Lazada Token Saved", $saved->toArray());
            return response()->json([
                'platform'      => 'lazada',
                'laz_seller_id' => $sellerId,
                'room_default_id' => $roomId,
                'account'       => $resp['account'] ?? null,
                'country'       => $resp['country'] ?? null,
                'access_token'  => $resp['access_token'],
                'refresh_token' => $resp['refresh_token'] ?? null,
                'expire_in'     => $resp['expires_in'] ?? null,
                'description'   => $req->input('description'),
                'country_user_info' => $resp['country_user_info'] ?? [],
            ]);
        }
        return response()->json($resp);
    }

    // ---------------- TIKTOK ----------------
    public function tiktokAuthUrl(Request $req)
    {
        $serviceId = $req->input('service_id');
        $redirect  = $req->input('callback_url');
        $state     = uniqid("tiktok_", true);

        if (empty($serviceId) || empty($redirect)) {
            return response()->json(['error' => 'ต้องกรอก service_id และ callback_url'], 422);
        }

        $url = "https://services.tiktokshop.com/open/authorize?" . http_build_query([
            'service_id'   => $serviceId,
            'state'        => $state,
            'redirect_uri' => $redirect,
            'scope'        => implode(',', [
                'seller.shop.info',
                'seller.product.basic',
                'seller.order.info',
                'seller.chat.basic'
            ]),
        ]);

        return response()->json(['auth_url' => $url]);
    }

    public function tiktokCallback(Request $request)
    {
        $code  = $request->query('code');
        $state = $request->query('state');

        if (!$code) {
            return response()->json(['error' => 'Missing code'], 422);
        }

        $frontendUrl = "https://dev2.pumpkin-th.com/TokenManager";
        return redirect()->away("{$frontendUrl}?code={$code}&platform=tiktok");
    }

    public function tiktokExchange(Request $req)
    {
        $code       = $req->input('code');
        $appKey     = $req->input('app_key');
        $appSecret  = $req->input('app_secret');
        $roomId     = $req->input('room_default_id');
        $desc       = $req->input('description');

        if (!$code || !$appKey || !$appSecret) {
            Log::channel('webhook_tiktok_new')->warning("❌ TikTok Exchange missing params", [
                'code' => $code,
                'appKey' => $appKey,
                'appSecret' => $appSecret,
            ]);
            return response()->json(['error' => 'missing required params'], 422);
        }

        Log::channel('webhook_tiktok_new')->info("📤 TikTok Exchange Request", [
            'app_key' => $appKey,
            'auth_code' => $code,
        ]);

        $resp = Http::get('https://auth.tiktok-shops.com/api/v2/token/get', [
            'app_key'    => $appKey,
            'app_secret' => $appSecret,
            'auth_code'  => $code,
            'grant_type' => 'authorized_code',
        ])->json();

        Log::channel('webhook_tiktok_new')->info("📥 TikTok Token API Response", $resp);

        if (!empty($resp['data']['access_token'])) {
            $desc = $desc ?: ($resp['data']['seller_name'] ?? 'tiktok');
            $saved = PlatformAccessTokens::updateOrCreate(
                ['platform' => 'tiktok', 'tiktok_open_id' => $resp['data']['open_id'] ?? null],
                [
                    'accessTokenId'        => uniqid("ttk_", true),
                    'accessToken'          => $resp['data']['access_token'],
                    'platform'             => 'tiktok',
                    'description'          => $desc,
                    'room_default_id'      => $roomId,

                    'tiktok_open_id'       => $resp['data']['open_id'] ?? null,
                    'tiktok_seller_name'   => $resp['data']['seller_name'] ?? null,
                    'tiktok_region'        => $resp['data']['seller_base_region'] ?? null,
                    'tiktok_app_key'       => $appKey,
                    'tiktok_app_secret'    => $appSecret,
                    'tiktok_refresh_token' => $resp['data']['refresh_token'] ?? null,

                    'expire_at'            => Carbon::createFromTimestamp($resp['data']['access_token_expire_in']),
                ]
            );

            Log::channel('webhook_tiktok_new')->info("✅ TikTok Token Saved", $saved->toArray());
            return response()->json([
                'platform'             => 'tiktok',
                'open_id'              => $resp['data']['open_id'],
                'seller_name'          => $resp['data']['seller_name'] ?? null,
                'seller_base_region'   => $resp['data']['seller_base_region'] ?? null,
                'access_token'         => $resp['data']['access_token'],
                'refresh_token'        => $resp['data']['refresh_token'],
                'expire_in'            => $resp['data']['access_token_expire_in'],
                'refresh_token_expire' => $resp['data']['refresh_token_expire_in'],
                'description'          => $desc,
            ]);
        }

        Log::channel('webhook_tiktok_new')->error("❌ TikTok Token Exchange Failed", $resp);
        return response()->json($resp);
    }
}
