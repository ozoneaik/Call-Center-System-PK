<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class RefreshLazadaTokens extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'lazada:refresh-tokens {--force : บังคับ Refresh ทุกร้านโดยไม่สนเวลาหมดอายุ}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'ตรวจสอบและ Refresh Access Token ของ Lazada ที่ใกล้หมดอายุ (เหลือน้อยกว่า 3 วัน)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 เริ่มต้นการตรวจสอบ Lazada Tokens...');
        Log::channel('webhook_lazada_new')->info('--- เริ่มรัน Command: lazada:refresh-tokens ---');

        $isForce = $this->option('force');

        // ดึงข้อมูลร้านค้า Lazada ทั้งหมดที่มี Refresh Token
        $platforms = DB::table('platform_access_tokens')
            ->where('platform', 'lazada')
            ->whereNotNull('laz_refresh_token')
            ->get();

        if ($platforms->isEmpty()) {
            $this->warn('ไม่พบข้อมูลร้านค้า Lazada ในระบบ');
            return;
        }

        $successCount = 0;
        $failCount = 0;

        foreach ($platforms as $platform) {
            $shopId = $platform->laz_seller_id ?? $platform->id;

            // เช็คว่าหมดอายุหรือใกล้จะหมดในอีก 3 วันหรือไม่ (Lazada token อายุ 30 วัน)
            $isExpiringSoon = empty($platform->expire_at) || Carbon::parse($platform->expire_at)->subDays(3)->isPast();

            if (!$isForce && !$isExpiringSoon) {
                $this->line("⏳ ข้ามร้าน ID: {$shopId} (Token ยังใช้ได้ถึง: {$platform->expire_at})");
                continue;
            }

            $this->info("🔄 กำลัง Refresh Token ให้ร้าน ID: {$shopId} ...");

            try {
                $this->refreshAccessToken($platform);
                $this->info("✅ สำเร็จ: Shop ID {$shopId}");
                $successCount++;
            } catch (\Exception $e) {
                $this->error("❌ ล้มเหลว: Shop ID {$shopId} | Error: {$e->getMessage()}");
                Log::channel('webhook_lazada_new')->error("Command Refresh Token Fail [Shop: {$shopId}]: " . $e->getMessage());
                $failCount++;
            }
        }

        $this->info("🎉 เสร็จสิ้น! สำเร็จ: {$successCount} ร้าน | ล้มเหลว: {$failCount} ร้าน");
        Log::channel('webhook_lazada_new')->info("--- สิ้นสุดรัน Command: สำเร็จ {$successCount}, ล้มเหลว {$failCount} ---");
    }

    /**
     * Logic สำหรับยิง API ขอ Token ใหม่ของ Lazada (HMAC-SHA256)
     */
    private function refreshAccessToken($row)
    {
        $appKey       = $row->laz_app_key;
        $appSecret    = $row->laz_app_secret;
        $refreshToken = $row->laz_refresh_token;

        $timestamp = round(microtime(true) * 1000);
        $params = [
            'app_key'       => $appKey,
            'refresh_token' => $refreshToken,
            'timestamp'     => $timestamp,
            'sign_method'   => 'sha256',
        ];

        // 1. เรียงลำดับ Parameter เพื่อทำ Signature
        $apiPath = '/auth/token/refresh';
        ksort($params);
        $signString = $apiPath;
        foreach ($params as $k => $v) {
            $signString .= $k . $v;
        }

        // 2. เข้ารหัสด้วย HMAC-SHA256
        $params['sign'] = strtoupper(hash_hmac('sha256', $signString, $appSecret));

        // 3. ยิง API ไปที่ Lazada
        $response = Http::asForm()->post('https://auth.lazada.com/rest/auth/token/refresh', $params);

        $json = $response->json();

        // เช็คว่ายิงสำเร็จและได้ access_token กลับมาหรือไม่
        if (!$response->successful() || empty($json['access_token'])) {
            throw new \Exception(json_encode($json));
        }

        // 4. คำนวณวันหมดอายุใหม่ และอัปเดตลง Database
        $expireAt = Carbon::now()->addSeconds($json['expires_in'] ?? 0);
        $sellerId = $json['country_user_info_list'][0]['seller_id'] ?? $row->laz_seller_id;

        DB::table('platform_access_tokens')
            ->where('id', $row->id)
            ->update([
                'accessToken'       => $json['access_token'],
                'laz_refresh_token' => $json['refresh_token'] ?? $refreshToken, // บางที Lazada จะคืนตัวเก่ามา
                'expire_at'         => $expireAt,
                'laz_seller_id'     => $sellerId,
                'updated_at'        => Carbon::now(),
            ]);
    }
}
