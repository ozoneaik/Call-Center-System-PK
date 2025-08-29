<?php

namespace App\Http\Controllers\webhooks\new;

use App\Http\Controllers\Controller;
use App\Models\PlatformAccessTokens;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ShopeeController extends Controller
{


    public function index()
    {
        return response()->json([
            'message' => 'Authorization successful'
        ]);
    }
    public function webhook(Request $request)
    {
        Log::info(json_encode($request->all(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        return response('ok');
    }

    public function authorization(Request $request)
    {
        $req = $request->all();
        $shop_id = $req['shopee_shop_id'];
        $platform_access_token = PlatformAccessTokens::query()->where('platform', 'shopee')
            ->where('shopee_shop_id', $shop_id)
            ->first();
        if ($platform_access_token) {
            $host = "https://partner.shopeemobile.com";
            $partnerId = $platform_access_token['shopee_partner_id'];
            $partnerKey = $platform_access_token['shopee_partner_key'];
            $path = "/api/v2/auth/token/get";
            $code = $platform_access_token['shopee_code'];
            $shopId = $platform_access_token['shopee_shop_id'];
            $timest = time();
            $body = array("code" => $code,  "shop_id" => $shopId, "partner_id" => $partnerId);
            $baseString = sprintf("%s%s%s", $partnerId, $path, $timest);
            $sign = hash_hmac('sha256', $baseString, $partnerKey);
            $url = sprintf("%s%s?partner_id=%s&timestamp=%s&sign=%s", $host, $path, $partnerId, $timest, $sign);
            $c = curl_init($url);
            curl_setopt($c, CURLOPT_POST, 1);
            curl_setopt($c, CURLOPT_POSTFIELDS, json_encode($body));
            curl_setopt($c, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
            curl_setopt($c, CURLOPT_RETURNTRANSFER, 1);
            $resp = curl_exec($c);
            $ret = json_decode($resp, true);
            $accessToken = $ret["access_token"];
            $newRefreshToken = $ret["refresh_token"];
            return response()->json([
                'access_token' => $accessToken,
                'refresh_token' => $newRefreshToken,
                'raw' => $ret
            ]);
        } else {
            return response()->json([
                'message' => 'ไม่พบร้านค้าในระบบ'
            ], 404);
        }
    }
}
