<?php

namespace App\Http\Controllers\webhooks\new;

use App\Http\Controllers\Controller;
use App\Models\PlatformAccessTokens;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShopeeController extends Controller
{
    // public function index()
    // {
    //     return response()->json([
    //         'message' => 'Authorization successful'
    //     ]);
    // }
    // public function webhook(Request $request)
    // {
    //     Log::info(json_encode($request->all(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    //     return response('ok');
    // }

    // public function authorization(Request $request)
    // {
    //     $code = $request->input('code');      
    //     $shopId = $request->input('shop_id'); 

    //     $platform_access_token = PlatformAccessTokens::query()
    //         ->where('platform', 'shopee')
    //         ->where('shopee_shop_id', $shopId)
    //         ->first();

    //     if (!$platform_access_token) {
    //         return response()->json([
    //             'message' => 'ไม่พบร้านค้าในระบบ'
    //         ], 404);
    //     }

    //     $host = "https://partner.shopeemobile.com";
    //     $path = "/api/v2/auth/token/get";
    //     $partnerId = 2011940;
    //     $partnerKey = "shpk694e594e524d684b517170527854424e74514a4d4e564c42517a6358696b";
    //     $timestamp = time();

    //     $baseString = sprintf("%s%s%s", $partnerId, $path, $timestamp);
    //     $sign = hash_hmac('sha256', $baseString, $partnerKey);

    //     $url = sprintf(
    //         "%s%s?partner_id=%s&timestamp=%s&sign=%s",
    //         $host,
    //         $path,
    //         $partnerId,
    //         $timestamp,
    //         $sign
    //     );

    //     $body = [
    //         "code"       => $code,
    //         "shop_id"    => (int)$shopId,
    //         "partner_id" => (int)$partnerId,
    //     ];

    //     $ch = curl_init($url);
    //     curl_setopt($ch, CURLOPT_POST, 1);
    //     curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    //     curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    //     curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    //     $resp = curl_exec($ch);
    //     curl_close($ch);

    //     $ret = json_decode($resp, true);

    //     if (isset($ret['access_token'])) {
    //         return response()->json([
    //             'access_token'  => $ret['access_token'],
    //             'refresh_token' => $ret['refresh_token'] ?? null,
    //             'expire_in'     => $ret['expire_in'] ?? null,
    //             'raw'           => $ret
    //         ]);
    //     }

    //     return response()->json([
    //         'message' => 'ขอ Access Token ไม่สำเร็จ',
    //         'raw' => $ret
    //     ], 400);
    // }

    // public function refreshToken(Request $request)
    // {
    //     $shopId = $request->input('shop_id');

    //     $platform_access_token = PlatformAccessTokens::query()
    //         ->where('platform', 'shopee')
    //         ->where('shopee_shop_id', $shopId)
    //         ->first();

    //     if (!$platform_access_token) {
    //         return response()->json([
    //             'message' => 'ไม่พบร้านค้าในระบบ'
    //         ], 404);
    //     }

    //     $host       = "https://partner.shopeemobile.com";
    //     $path       = "/api/v2/auth/access_token/get";
    //     $partnerId  = 2011940; 
    //     $partnerKey = "shpk694e594e524d684b517170527854424e74514a4d4e564c42517a6358696b";
    //     $refreshTok = $platform_access_token->shopee_refresh_token; 
    //     $timestamp  = time();

    //     $baseString = $partnerId . $path . $timestamp;
    //     $sign       = hash_hmac('sha256', $baseString, $partnerKey);

    //     $url = sprintf(
    //         "%s%s?partner_id=%s&timestamp=%s&sign=%s",
    //         $host,
    //         $path,
    //         $partnerId,
    //         $timestamp,
    //         $sign
    //     );

    //     $body = [
    //         "partner_id"    => (int)$partnerId,
    //         "shop_id"       => (int)$shopId,
    //         "refresh_token" => $refreshTok,
    //     ];

    //     $ch = curl_init($url);
    //     curl_setopt($ch, CURLOPT_POST, 1);
    //     curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    //     curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    //     curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    //     $resp = curl_exec($ch);
    //     curl_close($ch);

    //     $ret = json_decode($resp, true);

    //     if (isset($ret['access_token'])) {
    //         $platform_access_token->update([
    //             'accessToken'          => $ret['access_token'],
    //             'shopee_refresh_token' => $ret['refresh_token'],
    //             'expire_at'            => now()->addSeconds($ret['expire_in']),
    //         ]);

    //         return response()->json([
    //             'access_token'  => $ret['access_token'],
    //             'refresh_token' => $ret['refresh_token'] ?? null,
    //             'expire_in'     => $ret['expire_in'] ?? null,
    //             'raw'           => $ret
    //         ]);
    //     }

    //     return response()->json([
    //         'message' => 'รีเฟรช Access Token ไม่สำเร็จ',
    //         'raw' => $ret
    //     ], 400);
    // }

    private string $host;
    private string $partnerId;
    private string $partnerKey;

    public function __construct()
    {
        $this->host      = config('shopee.base_url', env('SHOPEE_HOST', 'https://partner.shopeemobile.com'));
        $this->partnerId = (string) env('SHOPEE_PARTNER_ID_TEST');
        $this->partnerKey = (string) env('SHOPEE_PARTNER_KEY_TEST');
    }

    public function index()
    {
        return response()->json(['message' => 'Authorization endpoint ready']);
    }

    public function authorization(Request $request)
    {
        $request->validate([
            'code'    => 'required|string',
            'shop_id' => 'required|numeric',
        ]);

        $code   = $request->string('code');
        $shopId = (int) $request->input('shop_id');

        $path      = '/api/v2/auth/token/get';
        $timestamp = time();
        $base      = $this->partnerId . $path . $timestamp;
        $sign      = hash_hmac('sha256', $base, $this->partnerKey);

        $url = sprintf(
            '%s%s?partner_id=%s&timestamp=%s&sign=%s',
            $this->host,
            $path,
            $this->partnerId,
            $timestamp,
            $sign
        );

        $body = [
            'code'       => (string) $code,
            'shop_id'    => $shopId,
            'partner_id' => (int) $this->partnerId,
        ];

        $resp = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post($url, $body);

        $json = $resp->json();

        Log::info('Shopee token/get response', ['status' => $resp->status(), 'body_exists' => !empty($json)]);

        if ($resp->successful() && isset($json['access_token'])) {
            return response()->json([
                'access_token'  => $json['access_token'],
                'refresh_token' => $json['refresh_token'] ?? null,
                'expire_in'     => $json['expire_in'] ?? null,
                'raw'           => $json,
            ]);
        }

        return response()->json([
            'message' => 'ขอ Access Token ไม่สำเร็จ',
            'raw'     => $json,
        ], $resp->status() ?: 400);
    }

    public function refreshToken(Request $request)
    {
        $request->validate([
            'refresh_token' => 'required|string',
            'shop_id'       => 'required|numeric',
        ]);

        $refreshToken = $request->string('refresh_token');
        $shopId       = (int) $request->input('shop_id');

        $path      = '/api/v2/auth/access_token/get';
        $timestamp = time();
        $base      = $this->partnerId . $path . $timestamp;
        $sign      = hash_hmac('sha256', $base, $this->partnerKey);

        $url = sprintf(
            '%s%s?partner_id=%s&timestamp=%s&sign=%s',
            $this->host,
            $path,
            $this->partnerId,
            $timestamp,
            $sign
        );

        $body = [
            'partner_id'    => (int) $this->partnerId,
            'shop_id'       => $shopId,
            'refresh_token' => (string) $refreshToken,
        ];

        $resp = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post($url, $body);

        $json = $resp->json();

        Log::info('Shopee access_token/get response', ['status' => $resp->status(), 'body_exists' => !empty($json)]);

        if ($resp->successful() && isset($json['access_token'])) {
            return response()->json([
                'access_token'  => $json['access_token'],
                'refresh_token' => $json['refresh_token'] ?? null,
                'expire_in'     => $json['expire_in'] ?? null,
                'raw'           => $json,
            ]);
        }

        return response()->json([
            'message' => 'รีเฟรช Access Token ไม่สำเร็จ',
            'raw'     => $json,
        ], $resp->status() ?: 400);
    }

    public function webhook(Request $request)
    {
        Log::info(json_encode($request->all(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        return response('ok');
    }
}
