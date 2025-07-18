<?php

namespace App\Http\Controllers\webhooks;

use App\Http\Controllers\Controller;
use App\Models\LazadaAccessToken;
use App\Services\LazadaTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LazadaNewController extends Controller
{
    protected $lazadaTokenService;
    protected string $start_log_line = '--------------------------------------------------🌞 เริ่มรับ Token--------------------------------------------------';
    protected string $end_log_line = '---------------------------------------------------🌚 สิ้นสุดรับ Token---------------------------------------------------';
    protected string $end_log_line_refrsh = '---------------------------------------------------🌚 สิ้นสุดรับ Refresh Token---------------------------------------------------';

    public function __construct(LazadaTokenService $lazadaTokenService)
    {
        $this->lazadaTokenService = $lazadaTokenService;
    }

    public function handleCallback(Request $request)
    {
        $code = $request->input('code');

        if (!$code) {
            return response('Missing code', 400);
        }

        $appKey = env('LAZADA_APP_KEY');
        $appSecret = env('LAZADA_APP_SECRET');
        $timestamp = round(microtime(true) * 1000); // milliseconds

        // Lazada requires these parameters
        $params = [
            'app_key' => $appKey,
            'code' => $code,
            'timestamp' => $timestamp,
            'sign_method' => 'sha256',
        ];

        $apiPath = '/auth/token/create';
        $sign = $this->generateLazadaSignature($params, $appSecret, $apiPath);
        $params['sign'] = $sign;

        $response = Http::asForm()->post('https://auth.lazada.com/rest/auth/token/create', $params);

        if ($response->successful()) {
            $data = $response->json();
            Log::channel('lazada_webhook_log')->info('Lazada token raw response:', $data);
            $this->lazadaTokenService->saveToken($data);
            Log::channel('lazada_webhook_log')->info($this->start_log_line);
            Log::channel('lazada_webhook_log')->info('✅ Lazada token received:', $data);
            Log::channel('lazada_webhook_log')->info($this->end_log_line);
            return response()->json([
                'message' => 'แลก token สำเร็จ',
                'data' => $data
            ]);
        } else {
            Log::channel('lazada_webhook_log')->error('❌ Token exchange failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return response()->json([
                'error' => 'แลก token ไม่สำเร็จ',
                'details' => $response->json()
            ], 500);
        }
    }

    public function refreshToken(Request $request)
    {
        $refreshToken = $request->input('refresh_token');

        if (!$refreshToken) {
            return response()->json(['error' => 'Missing refresh_token'], 400);
        }

        $result = $this->lazadaTokenService->refreshAccessToken($refreshToken);

        if ($result) {
            Log::channel('lazada_webhook_log')->info('Token refreshed via controller:' . PHP_EOL . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
            Log::channel('lazada_webhook_log')->info($this->end_log_line_refrsh);
            return response()->json([
                'message' => 'Token refreshed successfully',
                'data' => $result
            ]);
        } else {
            Log::channel('lazada_webhook_log')->error('Failed to refresh token via controller', ['refresh_token' => $refreshToken]);
            return response()->json([
                'error' => 'Failed to refresh token'
            ], 500);
        }
    }

    private function generateLazadaSignature(array $params, string $appSecret, string $apiPath): string
    {
        ksort($params);
        $signString = $apiPath;
        foreach ($params as $key => $value) {
            if ($key !== 'sign' && !is_null($value)) {
                $signString .= $key . $value;
            }
        }

        // 3. HMAC-SHA256 encode and uppercase hex
        return strtoupper(hash_hmac('sha256', $signString, $appSecret));
    }

    /**
     * ตรวจสอบว่า token เหลือกี่วันก่อนหมดอายุ
     *
     * @param string $seller_id
     * @return JsonResponse
     */
    public function checkTokenExpiry(string $seller_id): JsonResponse
    {
        $token = LazadaAccessToken::where('seller_id', $seller_id)->first();

        if (!$token) {
            return response()->json([
                'message' => 'ไม่พบ token ของ seller_id นี้',
            ], 404);
        }

        $daysLeft = $this->lazadaTokenService->checkTokenExpiry($token->expired_at);

        return response()->json([
            'message' => 'ตรวจสอบอายุ token เรียบร้อย',
            'seller_id' => $seller_id,
            'days_left' => $daysLeft,
            'expired_at' => $token->expired_at,
        ]);
    }
}
