<?php

namespace App;

use App\Models\ShopeeToken;
use Carbon\Carbon;
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

        $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post($url, [
                'refresh_token' => $refreshToken,
                'partner_id'    => $partnerId,
                'shop_id'       => $shopId,
            ]);

        $data = $response->json();

        if (isset($data['access_token'])) {
            $now = Carbon::now();
            $expireIn = $data['expire_in'] ?? 14400; // ค่า default 4 ชม.

            ShopeeToken::updateOrCreate(
                ['shop_id' => $shopId],
                [
                    'access_token' => $data['access_token'],
                    'refresh_token' => $data['refresh_token'],
                    'expire_in' => $expireIn,
                    'token_created_at' => $now,
                    'token_expired_at' => $now->copy()->addSeconds($expireIn),
                ]
            );
        }

        return [
            'shopee_response' => $data,
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
