<?php

namespace App\Http\Controllers;

use App\Models\PlatformAccessTokens;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PlatformTokenController extends Controller
{
    // ---------------- SHOPEE ----------------
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

    public function shopeeExchange(Request $req)
    {
        $code       = $req->input('code');
        $shopId     = $req->input('shop_id');
        $partnerId  = $req->input('partner_id');
        $partnerKey = trim($req->input('partner_key'));
        $redirect   = $req->input('callback_url');

        if (!$code || !$shopId || !$partnerId || !$partnerKey || !$redirect) {
            return response()->json(['error' => 'missing required params'], 422);
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
            ->post($url, $body)
            ->json();

        if (!empty($resp['access_token'])) {
            $saved = PlatformAccessTokens::updateOrCreate(
                ['platform' => 'shopee', 'shopee_shop_id' => $shopId],
                [
                    'accessTokenId'        => uniqid("shp_", true),
                    'accessToken'          => $resp['access_token'],
                    'description'          => $req->input('description'),
                    'platform'             => 'shopee',
                    'shopee_refresh_token' => $resp['refresh_token'],
                    'expire_at'            => Carbon::now()->addSeconds($resp['expire_in']),
                    'shopee_partner_id'    => $partnerId,
                    'shopee_partner_key'   => $partnerKey,
                    'shopee_code'          => $code,
                ]
            );

            Log::info("Shopee Token Saved", $saved->toArray());

            return response()->json([
                'shop_id'       => $shopId,
                'access_token'  => $resp['access_token'],
                'refresh_token' => $resp['refresh_token'],
                'expire_in'     => $resp['expire_in'],
                'description'   => $req->input('description'),
            ]);
        }

        return response()->json($resp);
    }

    public function shopeeCallback(Request $request)
    {
        $code   = $request->query('code');
        $shopId = $request->query('shop_id');

        if (!$code || !$shopId) {
            return response()->json(['error' => 'Missing code or shop_id'], 422);
        }
        $frontendUrl = "https://dev2.pumpkin-th.com/TokenManager";
        return redirect()->away("{$frontendUrl}?code={$code}&shop_id={$shopId}");
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

        // 🔑 Lazada signature
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
                    'laz_app_key'    => $appKey,
                    'laz_app_secret' => $appSecret,
                    'laz_seller_id'  => $sellerId,
                    'expire_at'      => Carbon::now()->addSeconds($resp['expires_in'] ?? 0),
                ]
            );

            Log::info("✅ Lazada Token Saved", $saved->toArray());

            return response()->json([
                'laz_seller_id' => $sellerId,
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
}
