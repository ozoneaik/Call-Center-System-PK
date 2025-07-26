<?php

namespace App\Http\Controllers\Chats\Tiktok;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class TikTokShopController extends Controller
{
    private $appKey;
    private $appSecret;
    private $accessToken;
    private $shopCipher;
    private $apiBaseUrl;

    public function __construct()
    {
        $this->appKey = config('services.tiktok.app_key');
        $this->appSecret = config('services.tiktok.app_secret');
        $this->accessToken = config('services.tiktok.access_token');
        $this->shopCipher = config('services.tiktok.shop_cipher');
        $this->apiBaseUrl = config('services.tiktok.api_base_url', 'https://open-api.tiktokglobalshop.com');
    }

    /**
     * Generate a signature for TikTok Shop API requests.
     * @param string $path - The API endpoint path (e.g., /order/202309/orders).
     * @param array $queryParams - The query parameters.
     * @param string|null $body - The JSON-encoded request body.
     * @return string The generated HMAC-SHA256 signature.
     */
    private function generateSign(string $path, array $queryParams, ?string $body = null): string
    {
        $filteredParams = array_filter($queryParams, function ($key) {
            return $key !== 'sign' && $key !== 'access_token';
        }, ARRAY_FILTER_USE_KEY);

        ksort($filteredParams);

        $paramString = '';
        foreach ($filteredParams as $key => $value) {
            $paramString .= $key . (is_array($value) ? json_encode($value, JSON_UNESCAPED_SLASHES) : $value);
        }

        $baseString = $path . $paramString;

        if ($body) {
            $baseString .= $body;
        }

        $stringToSign = $this->appSecret . $baseString . $this->appSecret;
        return hash_hmac('sha256', $stringToSign, $this->appSecret);
    }

    /**
     * Get the list of shops authorized by the developer's app.
     */
    public function getAuthorizedShops()
    {
        $path = '/authorization/202309/shops';
        try {
            $queryParams = [
                'app_key' => $this->appKey,
                'timestamp' => time(),
            ];
            $queryParams['sign'] = $this->generateSign($path, $queryParams, null);
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'x-tts-access-token' => $this->accessToken,
            ])
                ->withOptions(['query' => $queryParams])
                ->get($this->apiBaseUrl . $path);

            $json = $response->json();

            Log::channel('tiktok_token_log')->info('TikTok Authorized Response', [
                'response' => json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            ]);

            if ($response->successful() && isset($json['code']) && $json['code'] === 0) {
                return response()->json(['message' => 'ดึงข้อมูลร้านค้าสำเร็จ!', 'data' => $json['data']]);
            } else {
                return response()->json(['error' => 'ไม่สามารถดึงข้อมูลร้านค้าได้', 'details' => $json['message'] ?? 'Unknown error'], $response->status());
            }
        } catch (\Exception $e) {
            return response()->json(['error' => 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ TikTok API', 'exception' => $e->getMessage()], 500);
        }
    }

    /**
     * Example Request URL from your frontend/Postman:
     * /api/tiktok/order-detail?order_ids=579698391586931722
     */
    public function getOrderDetail(Request $request)
    {
        try {
            $validated = $request->validate([
                'order_ids' => 'required|string|min:1',
            ]);
            $orderIds = $validated['order_ids'];
        } catch (ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'messages' => $e->errors()], 422);
        }

        $path = '/order/202309/orders';

        try {
            $queryParams = [
                'app_key' => $this->appKey,
                'timestamp' => time(),
                'shop_cipher' => $this->shopCipher,
                'ids' => $orderIds,
            ];

            $queryParams['sign'] = $this->generateSign($path, $queryParams, null);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'x-tts-access-token' => $this->accessToken,
            ])
                ->withOptions(['query' => $queryParams])
                ->get($this->apiBaseUrl . $path);

            $json = $response->json();

            Log::channel('tiktok_token_log')->info('📦 TikTok Order Detail Response', [
                'request_url' => $this->apiBaseUrl . $path,
                'query_params' => $queryParams,
                'response' => json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            ]);

            if ($response->successful() && isset($json['code']) && $json['code'] === 0) {
                return response()->json([
                    'message' => 'ดึงข้อมูลออเดอร์สำเร็จ!',
                    'data' => $json['data']
                ]);
            } else {
                Log::channel('tiktok_token_log')->error('❌ TikTok Get Order Detail Failed', [
                    'response' => json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
                ]);
                return response()->json([
                    'error' => 'ไม่สามารถดึงข้อมูลออเดอร์ได้',
                    'details' => $json['message'] ?? 'Unknown error'
                ], $response->status());
            }
        } catch (\Exception $e) {
            Log::channel('tiktok_token_log')->error('🔥 TikTok API Exception: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ TikTok API',
                'exception' => $e->getMessage()
            ], 500);
        }
    }

    
}
