<?php

namespace App;

use Illuminate\Support\Facades\Http;

class ShopeeTokenService
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function getAccessToken($shopId, $refreshToken)
    {
        $partnerId = (int) env('SHOPEE_PARTNER_ID');
        $partnerKey = env('SHOPEE_PARTNER_KEY');
        $path = '/api/v2/auth/access_token/get';
        $timestamp = time();

        // Generate Sign
        $baseString = $partnerId . $path . $timestamp;
        $sign = hash_hmac('sha256', $baseString, $partnerKey);

        $url = "https://partner.shopeemobile.com$path?partner_id=$partnerId&timestamp=$timestamp&sign=$sign";

        // POST Body
        $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post($url, [
                'refresh_token' => $refreshToken,
                'partner_id'    => $partnerId,
                'shop_id'       => $shopId,
            ]);

        return [
            'shopee_response' => $response->json(),
            'debug' => [
                'partner_id' => $partnerId,
                'path' => $path,
                'timestamp' => $timestamp,
                'base_string' => $baseString,
                'sign' => $sign,
                'url' => $url,
            ]
        ];
    }
}
