<?php

namespace App\Http\Controllers\webhooks\new;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NewTikTokController extends Controller
{
    //
    public function webhooks(Request $request)
    {
        $data = $request->all();
        Log::channel('webhook_tiktok_new')->info('📥 TikTok Webhook Received', $data);
        return response()->json(['message' => 'ok']);
    }

    public function getAuthorizedShops(Request $req)
    {
        $appKey       = $req->input('app_key');
        $appSecret    = $req->input('app_secret');
        $accessToken  = $req->input('access_token');

        if (empty($appKey) || empty($appSecret) || empty($accessToken)) {
            return response()->json(['error' => 'missing required params'], 422);
        }

        $timestamp = time();
        $path = "/authorization/202309/shops";

        $params = [
            "app_key"   => $appKey,
            "timestamp" => $timestamp,
        ];

        ksort($params);

        $paramStr = "";
        foreach ($params as $k => $v) {
            $paramStr .= $k . $v;
        }

        $signStr = $path . $paramStr;
        $signStr = $appSecret . $signStr . $appSecret;
        $sign = hash_hmac('sha256', $signStr, $appSecret);

        $url = "https://open-api.tiktokglobalshop.com{$path}?" . http_build_query(array_merge($params, [
            "sign" => $sign,
        ]));

        Log::channel('webhook_tiktok_new')->info("📤 Get Authorized Shops Request", [
            "url"       => $url,
            "sign"      => $sign,
            "timestamp" => $timestamp,
        ]);

        $resp = Http::withHeaders([
            "x-tts-access-token" => $accessToken,
            "content-type"       => "application/json",
        ])->get($url)->json();

        Log::channel('webhook_tiktok_new')->info("📥 Get Authorized Shops Response", $resp);

        return response()->json([
            "request" => [
                "sign"      => $sign,
                "timestamp" => $timestamp,
                "url"       => $url,
            ],
            "response" => $resp,
        ]);
    }

    public function getShopWebhooks(Request $req)
    {
        $appKey       = $req->input('app_key');
        $appSecret    = $req->input('app_secret');
        $accessToken  = $req->input('access_token');
        $shopCipher   = $req->input('shop_cipher');

        if (empty($appKey) || empty($appSecret) || empty($accessToken) || empty($shopCipher)) {
            return response()->json(['error' => 'missing required params'], 422);
        }

        $timestamp = time();
        $path = "/event/202309/webhooks";

        $params = [
            "app_key"     => $appKey,
            "shop_cipher" => $shopCipher,
            "timestamp"   => $timestamp,
        ];

        ksort($params);

        $paramStr = "";
        foreach ($params as $k => $v) {
            $paramStr .= $k . $v;
        }

        $signStr = $path . $paramStr;
        $signStr = $appSecret . $signStr . $appSecret;
        $sign = hash_hmac('sha256', $signStr, $appSecret);

        $url = "https://open-api.tiktokglobalshop.com{$path}?" . http_build_query(array_merge($params, [
            "sign" => $sign,
        ]));

        Log::channel('webhook_tiktok_new')->info("📤 Get Shop Webhooks Request", [
            "url"       => $url,
            "sign"      => $sign,
            "timestamp" => $timestamp,
        ]);

        $resp = Http::withHeaders([
            "x-tts-access-token" => $accessToken,
            "content-type"       => "application/json",
        ])->get($url)->json();

       Log::channel('webhook_tiktok_new')->info("📥 Get Shop Webhooks Response", $resp);

        return response()->json([
            "request" => [
                "sign"        => $sign,
                "timestamp"   => $timestamp,
                "url"         => $url,
                "shop_cipher" => $shopCipher,
            ],
            "response" => $resp,
        ]);
    }
}
