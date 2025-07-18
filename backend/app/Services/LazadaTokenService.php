<?php

namespace App\Services;

use App\Models\LazadaAccessToken;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LazadaTokenService
{
    protected $appKey;
    protected $appSecret;
    protected string $start_log_line = '--------------------------------------------------🌞 เริ่มรับ Refresh Token--------------------------------------------------';
    protected string $end_log_line = '---------------------------------------------------🌚 สิ้นสุดรับ Refresh Token---------------------------------------------------';

    public function __construct()
    {
        $this->appKey = env('LAZADA_APP_KEY');
        $this->appSecret = env('LAZADA_APP_SECRET');
    }
    /**
     * Refresh access token using refresh_token
     *
     * @param string $refreshToken
     * @return array|null
     */
    public function refreshAccessToken(string $refreshToken): ?array
    {
        $timestamp = round(microtime(true) * 1000);
        $params = [
            'app_key' => $this->appKey,
            'refresh_token' => $refreshToken,
            'timestamp' => $timestamp,
            'sign_method' => 'sha256',
        ];
        $apiPath = '/auth/token/refresh';

        $sign = $this->generateLazadaSignature($params, $this->appSecret, $apiPath);
        $params['sign'] = $sign;

        $response = Http::asForm()->post('https://auth.lazada.com/rest/auth/token/refresh', $params);

        if ($response->successful()) {
            $data = $response->json();
            Log::channel('lazada_webhook_log')->info($this->start_log_line);
            Log::channel('lazada_webhook_log')->info('Lazada token refreshed successfully: ' . PHP_EOL . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
            // Log::channel('lazada_webhook_log')->info('Lazada token refreshed successfully', $data);

            // Save or update token info ตามที่ทำใน saveToken()
            $this->saveToken($data);

            return $data;
        } else {
            // Log::channel('lazada_webhook_log')->error('Failed to refresh Lazada token', [
            //     'status' => $response->status(),
            //     'body' => $response->body(),
            // ]);
            Log::channel('lazada_webhook_log')->error('Failed to refresh Lazada token: ' . PHP_EOL . json_encode([
                'status' => $response->status(),
                'body' => $response->body(),
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
            return null;
        }
    }

    /**
     * Signature generator (เหมือนที่ใช้แลก token)
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
     * ตรวจสอบอายุ token ที่เหลือ (จากวันที่ expired_at)
     * ถ้าใกล้หมดอายุ (เช่น <= 7 วัน) จะ log เตือน
     *
     * @param string|\DateTimeInterface $expiredAt   วันที่หมดอายุ token (timestamp, string หรือ Carbon object)
     * @return int|null  จำนวนวันเหลือ หรือ null ถ้า input ไม่ถูกต้อง
     */
    public function checkTokenExpiry($expiredAt): ?int
    {
        // แปลงเป็น Carbon object
        try {
            $expiryDate = $expiredAt instanceof Carbon
                ? $expiredAt
                : Carbon::parse($expiredAt);
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

        // แจ้งเตือนถ้าใกล้หมดอายุ (ตัวอย่าง 7 วัน)
        if ($daysLeft <= 7) {
            Log::channel('lazada_webhook_log')->warning("⚠️ Lazada token will expire soon in {$daysLeft} day(s)!");
        }

        return $daysLeft;
    }

    /**
     * Save token ลง database
     * ตัวอย่างฟังก์ชันนี้ให้แก้ให้ตรงกับ structure ของคุณ
     */
    public function saveToken(array $tokenData)
    {
        $sellerId = null;
        $country = $tokenData['country'] ?? null;

        if (!empty($tokenData['country_user_info_list'])) {
            foreach ($tokenData['country_user_info_list'] as $userInfo) {
                if (($userInfo['country'] ?? null) === $country) {
                    $sellerId = $userInfo['seller_id'] ?? null;
                    break;
                }
            }
        }

        if (empty($sellerId)) {
            Log::channel('lazada_webhook_log')->error('Could not find seller_id in token data: ' . PHP_EOL . json_encode($tokenData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
            throw new \Exception('ไม่พบ seller_id ในข้อมูล token');
        }

        return LazadaAccessToken::updateOrCreate(
            ['seller_id' => $sellerId],
            [
                'account' => $tokenData['account'] ?? null,
                'country' => $country,
                'access_token' => $tokenData['access_token'] ?? null,
                'refresh_token' => $tokenData['refresh_token'] ?? null,
                'expired_at' => now()->addSeconds($tokenData['expires_in'] ?? 0),
                'refresh_expired_at' => now()->addSeconds($tokenData['refresh_expires_in'] ?? 0),
            ]
        );
    }
}
