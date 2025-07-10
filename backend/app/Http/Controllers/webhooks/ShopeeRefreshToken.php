<?php

namespace App\Http\Controllers\webhooks;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShopeeRefreshToken extends Controller
{
    public function refresh()
    {
        $partnerId = (int) env('SHOPEE_PARTNER_ID');
        $partnerKey = env('SHOPEE_PARTNER_KEY');

        // shop_id และ refresh_token ควรดึงมาจากฐานข้อมูลของคุณตามแต่ละร้านค้า
        $shopId = 57198184;
        $refreshToken = env('SHOPEE_REFRESH_TOKEN'); // ควรดึงมาจาก DB

        $timestamp = time();
        $path = '/api/v2/auth/access_token/get';

        // 👉 Base string ที่ถูกต้องคือ: partner_id + path + timestamp
        $baseString = $partnerId . $path . $timestamp;
        $sign = hash_hmac('sha256', $baseString, $partnerKey);

        // Body ของ Request ไม่ต้องส่ง timestamp และ sign
        $postData = [
            'partner_id'    => $partnerId,
            'shop_id'       => $shopId,
            'refresh_token' => $refreshToken,
        ];

        // Query string สำหรับ URL
        $queryString = http_build_query([
            'partner_id' => $partnerId,
            'timestamp'  => $timestamp,
            'sign'       => $sign,
        ]);

        $host = "https://partner.sandbox.shopeemobile.com"; 
        $url = "{$host}{$path}?{$queryString}";

        Log::channel('shopee_token_log')->info('Shopee Refresh Token Request', [
            'url' => $url,
            'body' => $postData
        ]);

        $response = Http::post($url, $postData);

        Log::channel('shopee_token_log')->info('Shopee Refresh Response', $response->json());

        // เมื่อได้ token ใหม่มา ควรบันทึกลงฐานข้อมูลเพื่อใช้ในครั้งต่อไป
        if ($response->successful() && isset($response->json()['access_token'])) {
            $newAccessToken = $response->json()['access_token'];
            $newRefreshToken = $response->json()['refresh_token'];

            // TODO: บันทึก $newAccessToken และ $newRefreshToken ลง Database
        }

        return response()->json($response->json());
    }
}
