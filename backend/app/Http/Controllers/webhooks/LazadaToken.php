<?php

namespace App\Http\Controllers\webhooks;

use App\Http\Controllers\Controller;
use App\Models\LazadaAccessToken;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LazadaToken extends Controller
{
    //
    protected string $start_log_line       = '--------------------------------------------------🌞 เริ่มรับ Token--------------------------------------------------';
    protected string $end_log_line         = '---------------------------------------------------🌚 สิ้นสุดรับ Token---------------------------------------------------';
    protected string $end_log_line_refrsh  = '---------------------------------------------------🌚 สิ้นสุดรับ Refresh Token---------------------------------------------------';

    private string $appKey;
    private string $appSecret;

    public function __construct()
    {
        $this->appKey    = env('LAZADA_APP_KEY');
        $this->appSecret = env('LAZADA_APP_SECRET');
    }

    /**
     * Handle initial callback exchange code → access_token
     */
    public function handleCallback(Request $request)
    {
        $code = $request->input('code');
        if (!$code) {
            return response('Missing code', 400);
        }

        $timestamp = round(microtime(true) * 1000);
        $params = [
            'app_key'     => $this->appKey,
            'code'        => $code,
            'timestamp'   => $timestamp,
            'sign_method' => 'sha256',
        ];

        $apiPath = '/auth/token/create';
        $params['sign'] = $this->generateLazadaSignature($params, $this->appSecret, $apiPath);

        $response = Http::asForm()->post('https://auth.lazada.com/rest/auth/token/create', $params);

        if ($response->successful()) {
            $data = $response->json();
            Log::channel('lazada_webhook_log')->info('Lazada token raw response:', $data);

            $this->saveToken($data);

            Log::channel('lazada_webhook_log')->info($this->start_log_line);
            Log::channel('lazada_webhook_log')->info('✅ Lazada token received:', $data);
            Log::channel('lazada_webhook_log')->info($this->end_log_line);

            return response()->json([
                'message' => 'แลก token สำเร็จ',
                'data'    => $data
            ]);
        } else {
            Log::channel('lazada_webhook_log')->error('❌ Token exchange failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            return response()->json([
                'error'   => 'แลก token ไม่สำเร็จ',
                'details' => $response->json()
            ], 500);
        }
    }

    /**
     * Refresh access token
     */
    public function refreshToken(Request $request)
    {
        $refreshToken = $request->input('refresh_token');
        if (!$refreshToken) {
            return response()->json(['error' => 'Missing refresh_token'], 400);
        }

        $result = $this->refreshAccessToken($refreshToken);
        if ($result) {
            Log::channel('lazada_webhook_log')->info(
                'Token refreshed via controller:' . PHP_EOL .
                    json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            );
            Log::channel('lazada_webhook_log')->info($this->end_log_line_refrsh);

            return response()->json([
                'message' => 'Token refreshed successfully',
                'data'    => $result
            ]);
        } else {
            Log::channel('lazada_webhook_log')->error(
                'Failed to refresh token via controller',
                ['refresh_token' => $refreshToken]
            );
            return response()->json(['error' => 'Failed to refresh token'], 500);
        }
    }

    /**
     * Refresh token logic (ย้ายมาจาก Service)
     */
    private function refreshAccessToken(string $refreshToken): ?array
    {
        $timestamp = round(microtime(true) * 1000);
        $params = [
            'app_key'       => $this->appKey,
            'refresh_token' => $refreshToken,
            'timestamp'     => $timestamp,
            'sign_method'   => 'sha256',
        ];
        $apiPath = '/auth/token/refresh';
        $params['sign'] = $this->generateLazadaSignature($params, $this->appSecret, $apiPath);

        $response = Http::asForm()->post('https://auth.lazada.com/rest/auth/token/refresh', $params);

        if ($response->successful()) {
            $data = $response->json();
            Log::channel('lazada_webhook_log')->info($this->start_log_line);
            Log::channel('lazada_webhook_log')->info(
                'Lazada token refreshed successfully: ' . PHP_EOL .
                    json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            );

            $this->saveToken($data);
            return $data;
        } else {
            Log::channel('lazada_webhook_log')->error(
                'Failed to refresh Lazada token: ' . PHP_EOL .
                    json_encode([
                        'status' => $response->status(),
                        'body'   => $response->body(),
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            );
            return null;
        }
    }

    /**
     * Signature generator
     */
    private function generateLazadaSignature(array $params, string $appSecret, string $apiPath): string
    {
        ksort($params);
        $signString = $apiPath;
        foreach ($params as $key => $value) {
            if ($key !== 'sign' && !is_null($value)) {
                $signString .= $key . $value;
            }
        }
        return strtoupper(hash_hmac('sha256', $signString, $appSecret));
    }

    /**
     * ตรวจสอบ token expiry
     */
    public function checkTokenExpiry(string $seller_id): JsonResponse
    {
        $token = LazadaAccessToken::where('seller_id', $seller_id)->first();
        if (!$token) {
            return response()->json(['message' => 'ไม่พบ token ของ seller_id นี้'], 404);
        }

        $daysLeft = $this->calculateTokenExpiry($token->expired_at);

        return response()->json([
            'message'    => 'ตรวจสอบอายุ token เรียบร้อย',
            'seller_id'  => $seller_id,
            'days_left'  => $daysLeft,
            'expired_at' => $token->expired_at,
        ]);
    }

    private function calculateTokenExpiry($expiredAt): ?int
    {
        try {
            $expiryDate = $expiredAt instanceof Carbon ? $expiredAt : Carbon::parse($expiredAt);
        } catch (\Exception $e) {
            Log::channel('lazada_webhook_log')->error('Invalid expired_at date for token check: ' . $e->getMessage());
            return null;
        }

        $now = Carbon::now();
        if ($expiryDate->lessThanOrEqualTo($now)) {
            Log::channel('lazada_webhook_log')->warning('Lazada token already expired at ' . $expiryDate->toDateTimeString());
            return 0;
        }

        $daysLeft = $now->diffInDays($expiryDate);
        Log::channel('lazada_webhook_log')->info("Lazada token expires in {$daysLeft} day(s) at {$expiryDate->toDateTimeString()}");

        if ($daysLeft <= 7) {
            Log::channel('lazada_webhook_log')->warning("⚠️ Lazada token will expire soon in {$daysLeft} day(s)!");
        }

        return $daysLeft;
    }

    /**
     * Save token ลง DB
     */
    private function saveToken(array $tokenData)
    {
        $sellerId = null;
        $country  = $tokenData['country'] ?? null;

        if (!empty($tokenData['country_user_info_list'])) {
            foreach ($tokenData['country_user_info_list'] as $userInfo) {
                if (($userInfo['country'] ?? null) === $country) {
                    $sellerId = $userInfo['seller_id'] ?? null;
                    break;
                }
            }
        }

        if (empty($sellerId)) {
            Log::channel('lazada_webhook_log')->error(
                'Could not find seller_id in token data: ' . PHP_EOL .
                    json_encode($tokenData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            );
            throw new \Exception('ไม่พบ seller_id ในข้อมูล token');
        }

        return LazadaAccessToken::updateOrCreate(
            ['seller_id' => $sellerId],
            [
                'account'             => $tokenData['account'] ?? null,
                'country'             => $country,
                'access_token'        => $tokenData['access_token'] ?? null,
                'refresh_token'       => $tokenData['refresh_token'] ?? null,
                'expired_at'          => now()->addSeconds($tokenData['expires_in'] ?? 0),
                'refresh_expired_at'  => now()->addSeconds($tokenData['refresh_expires_in'] ?? 0),
            ]
        );
    }
}
