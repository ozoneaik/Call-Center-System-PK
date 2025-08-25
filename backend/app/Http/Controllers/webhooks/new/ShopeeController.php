<?php

namespace App\Http\Controllers\webhooks\new;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

// code : 6b634c627963535a6b52476d6b447166
// shop_id : 1457370531
// partner_id : 2010939
// parther_key : 6e6a656f704c70674e41774c4b4950476166776b636466586c79434e62784f77
// refresh_token : 536d5457635363587578727448726a48
// access_token : 7444505a5545487673554c464c454e54

class ShopeeController extends Controller
{

    public function index()
    {
        return response()->json([
            'message' => 'Authorization successful'
        ]);
    }


    public function authorization(Request $request)
    {
        $host = "https://partner.shopeemobile.com";
        $partnerId = 2010939;
        $partnerKey = "6e6a656f704c70674e41774c4b4950476166776b636466586c79434e62784f77";
        $path = "/api/v2/auth/token/get";
        $code = '6b634c627963535a6b52476d6b447166';
        $shopId = 1457370531;
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
        echo "raw result: $resp";

        $ret = json_decode($resp, true);
        $accessToken = $ret["access_token"];
        $newRefreshToken = $ret["refresh_token"];
        echo "\naccess_token: $accessToken, refresh_token: $newRefreshToken raw: $ret" . "\n";
        return $ret;
    }

    public function webhook(Request $request)
    {
        Log::channel('webhook_shopee_new')->info(json_encode($request->all(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        return response('ok');
    }

    public function get_message()
    {
        $host = "https://partner.shopeemobile.com";
        $partnerId = 2010939;
        $partnerKey = "6e6a656f704c70674e41774c4b4950476166776b636466586c79434e62784f77";
        $path = "/api/v2/sellerchat/get_message";
        $code = '6b634c627963535a6b52476d6b447166';
        $shopId = 1457370531;
        $timest = time();
        $body = array("code" => $code,  "shop_id" => $shopId, "partner_id" => $partnerId);
        $baseString = sprintf("%s%s%s", $partnerId, $path, $timest);
        $sign = hash_hmac('sha256', $baseString, $partnerKey);
        $url = sprintf("%s%s?partner_id=%s&timestamp=%s&sign=%s", $host, $path, $partnerId, $timest, $sign);
    }

    public function send_message()
    {
        $accessToken = '7444505a5545487673554c464c454e54'; // มีสิทธิ์ chat_api และเป็นของ shop นี้
        $host = "https://partner.shopeemobile.com";
        $partnerId = 2010939;
        $partnerKey = "6e6a656f704c70674e41774c4b4950476166776b636466586c79434e62784f77";
        $path = "/api/v2/sellerchat/send_message";
        $shopId = 1457370531;
        $code = '6b634c627963535a6b52476d6b447166'; // optional, ไว้กันซ้ำ
        $toId = 1176893325;
        $timest = time();

        // ✅ เนื้อหาแบบ SellerChat
        $body = [
            "to_id"        => (int)$toId,
            "message_type" => "text",
            "content"      => ["text" => "สวัสดีครับ นี่คือข้อความตัวอย่าง"],
            "code"         => $code, // optional
        ];

        // ✅ สร้าง sign ตามสูตรที่ถูกต้อง (ไม่ต้อง hex2bin partnerKey)
        $baseString = $partnerId . $path . $timest . $accessToken . $shopId;
        $sign = hash_hmac('sha256', $baseString, $partnerKey); // ได้ค่า hex lowercase ถูกต้อง

        // ✅ ประกอบ URL พร้อม query auth
        $query = http_build_query([
            'partner_id'   => $partnerId,
            'shop_id'      => $shopId,
            'timestamp'    => $timest,
            'sign'         => $sign,
            'access_token' => $accessToken,
        ]);

        $url = $host . $path . '?' . $query;

        // เรียกยิง
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($body, JSON_UNESCAPED_UNICODE),
            CURLOPT_TIMEOUT        => 30,
        ]);

        $response = curl_exec($ch);
        if ($response === false) {
            $err = curl_error($ch);
            curl_close($ch);
            return ['success' => false, 'message' => 'cURL error: ' . $err];
        }
        curl_close($ch);

        $json = json_decode($response, true);
        if (isset($json['error']) && $json['error']) {
            return ['success' => false, 'message' => 'Shopee API error', 'details' => $json];
        }
        return ['success' => true, 'data' => $json];
    }
}
