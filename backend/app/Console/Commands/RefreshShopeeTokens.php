<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class RefreshShopeeTokens extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'shopee:refresh-tokens {--force : บังคับ Refresh ทุกร้านโดยไม่สนเวลาหมดอายุ}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'ตรวจสอบและ Refresh Access Token ของ Shopee ที่ใกล้หมดอายุ';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 เริ่มต้นการตรวจสอบ Shopee Tokens...');
        Log::channel('webhook_shopee_new')->info('--- เริ่มรัน Command: shopee:refresh-tokens ---');

        $isForce = $this->option('force');

        // ดึงข้อมูลร้านค้า Shopee ทั้งหมด
        $platforms = DB::table('platform_access_tokens')
            ->where('platform', 'shopee')
            ->whereNotNull('shopee_refresh_token')
            ->get();

        if ($platforms->isEmpty()) {
            $this->warn('ไม่พบข้อมูลร้านค้า Shopee ในระบบ');
            return;
        }

        $successCount = 0;
        $failCount = 0;

        foreach ($platforms as $platform) {
            $shopId = $platform->shopee_shop_id;

            // เช็คว่าหมดอายุหรือใกล้จะหมดในอีก 30 นาทีหรือไม่
            $isExpiringSoon = empty($platform->expire_at) || Carbon::parse($platform->expire_at)->subMinutes(30)->isPast();

            if (!$isForce && !$isExpiringSoon) {
                $this->line("⏳ ข้ามร้าน Shop ID: {$shopId} (Token ยังไม่หมดอายุ: {$platform->expire_at})");
                continue;
            }

            $this->info("🔄 กำลัง Refresh Token ให้ร้าน Shop ID: {$shopId} ...");

            try {
                $this->refreshAccessToken($platform);
                $this->info("✅ สำเร็จ: Shop ID {$shopId}");
                $successCount++;
            } catch (\Exception $e) {
                $this->error("❌ ล้มเหลว: Shop ID {$shopId} | Error: {$e->getMessage()}");
                Log::channel('webhook_shopee_new')->error("Command Refresh Token Fail [Shop: {$shopId}]: " . $e->getMessage());
                $failCount++;
            }
        }

        $this->info("🎉 เสร็จสิ้น! สำเร็จ: {$successCount} ร้าน | ล้มเหลว: {$failCount} ร้าน");
        Log::channel('webhook_shopee_new')->info("--- สิ้นสุดรัน Command: สำเร็จ {$successCount}, ล้มเหลว {$failCount} ---");
    }

    /**
     * Logic สำหรับยิง API ขอ Token ใหม่
     */
    private function refreshAccessToken($row)
    {
        $host       = "https://partner.shopeemobile.com";
        $partnerId  = $row->shopee_partner_id;
        $partnerKey = $row->shopee_partner_key;
        $shopId     = $row->shopee_shop_id;
        $refreshTok = $row->shopee_refresh_token;

        $path      = "/api/v2/auth/access_token/get";
        $timestamp = time();
        $baseStr   = $partnerId . $path . $timestamp;
        $sign      = hash_hmac('sha256', $baseStr, $partnerKey);

        $url = $host . $path . '?' . http_build_query([
            'partner_id' => $partnerId,
            'timestamp'  => $timestamp,
            'sign'       => $sign,
        ]);

        $body = [
            'partner_id'    => (int)$partnerId,
            'shop_id'       => (int)$shopId,
            'refresh_token' => $refreshTok,
        ];

        // ยิง API แบบใส่ User-Agent กันเหนียว
        $resp = Http::withHeaders([
            'Content-Type' => 'application/json',
            'User-Agent'   => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        ])->post($url, $body);

        $json = $resp->json();

        if (!$resp->successful() || !empty($json['error'])) {
            throw new \Exception(json_encode($json));
        }

        // อัปเดตลง Database
        DB::table('platform_access_tokens')
            ->where('id', $row->id)
            ->update([
                'accessToken'          => $json['access_token'],
                'shopee_refresh_token' => $json['refresh_token'],
                'expire_at'            => Carbon::now()->addSeconds($json['expire_in']),
                'updated_at'           => Carbon::now(),
            ]);
    }
}
