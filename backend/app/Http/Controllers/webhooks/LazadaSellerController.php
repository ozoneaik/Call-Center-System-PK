<?php

namespace App\Http\Controllers\webhooks;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LazadaSellerController extends Controller
{
    //
    public function getSellerInfo(Request $request)
    {
        $accessToken = $request->get('access_token'); // ส่งมาทาง query หรือ body
        if (!$accessToken) {
            return response()->json(['error' => 'access_token is required'], 400);
        }

        $appKey = config('services.lazada.app_key');
        $appSecret = config('services.lazada.app_secret');
        $timestamp = round(microtime(true) * 1000);
        $apiPath = "/seller/get";

        // --- 1. สร้าง string สำหรับ sign ---
        $params = [
            'app_key'     => $appKey,
            'timestamp'   => $timestamp,
            'sign_method' => 'sha256',
            'access_token' => $accessToken,
        ];

        // --- 2. เรียงพารามิเตอร์ตามลำดับ a-z เพื่อ sign ---
        ksort($params);
        $signString = $apiPath;
        foreach ($params as $key => $val) {
            $signString .= $key . $val;
        }

        $signature = strtoupper(hash_hmac('sha256', $signString, $appSecret));
        $params['sign'] = $signature;

        // --- 3. ส่ง request ไปยัง Lazada ---
        $url = 'https://api.lazada.co.th/rest' . $apiPath;

        try {
            $response = Http::get($url, $params);
            $body = $response->json();

            if ($response->successful() && isset($body['data']['name'])) {
                return response()->json([
                    'seller_name' => $body['data']['name'],
                    'raw' => $body
                ]);
            }

            return response()->json([
                'error' => $body['message'] ?? 'Unknown error',
                'code' => $body['code'] ?? 'Unknown code',
                'raw' => $body
            ], 400);
        } catch (\Exception $e) {
            Log::channel('lazada_webhook_log')->error("Lazada getSellerInfo error: " . $e->getMessage());
            return response()->json(['error' => 'Server error'], 500);
        }
    }
}
