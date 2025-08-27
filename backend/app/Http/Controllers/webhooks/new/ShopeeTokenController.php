<?php

namespace App\Http\Controllers\webhooks\new;

use App\Http\Controllers\Controller;
use App\Services\webhooks_new\ShopeeTokenService;
use Illuminate\Http\Request;

class ShopeeTokenController extends Controller
{
    protected $tokenService;

    public function __construct(ShopeeTokenService $tokenService)
    {
        $this->tokenService = $tokenService;
    }

    public function refreshToken(Request $request)
    {

        $shopId = $request->input('shop_id', (int) env('SHOPEE_SHOP_ID'));
        $refreshToken = $request->input('refresh_token', env('SHOPEE_REFRESH_TOKEN'));

        // ตรวจสอบว่ามี refresh_token จริง
        if (!$refreshToken) {
            return response()->json([
                'success' => false,
                'message' => 'Missing refresh_token.'
            ], 422);
        }

        $response = $this->tokenService->getAccessToken($shopId, $refreshToken);

        return response()->json($response);
    }

    public function generateSign()
    {
        $partnerId = (int) env('SHOPEE_PARTNER_ID', 2010939);
        $partnerKey = env('SHOPEE_PARTNER_KEY', '6e6a656f704c70674e41774c4b4950476166776b636466586c79434e62784f77');
        $path = '/api/v2/auth/access_token/get';
        $timestamp = time();

        $stringToBeSigned = $partnerId . $path . $timestamp;
        $sign = hash_hmac('sha256', $stringToBeSigned, $partnerKey);

        return response()->json([
            'partner_id' => $partnerId,
            'timestamp' => $timestamp,
            'path' => $path,
            'string_to_sign' => $stringToBeSigned,
            'sign' => $sign,
        ]);
    }
}