<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PlatformAccessTokens;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class SyncShopeeOrders extends Command
{
    // ชื่อคำสั่งสำหรับเรียกใช้ใน Terminal
    protected $signature = 'sync:shopee-orders {--days=90 : จำนวนวันย้อนหลังที่ต้องการดึง}';
    protected $description = 'ดึงข้อมูลออเดอร์ Shopee ย้อนหลังทั้งหมดมาเก็บใน Database';

    public function handle()
    {
        $days = (int) $this->option('days');
        $this->info("🚀 เริ่มต้น Sync ออเดอร์ Shopee ย้อนหลัง {$days} วัน...");

        // ดึงร้านค้า Shopee ทั้งหมดที่มีในระบบ
        $platforms = PlatformAccessTokens::where('platform', 'shopee')->get();

        if ($platforms->isEmpty()) {
            $this->error('❌ ไม่พบร้านค้า Shopee ในระบบ');
            return;
        }

        foreach ($platforms as $platform) {
            $this->info("🛒 กำลังดึงข้อมูลร้าน: {$platform->description} (Shop ID: {$platform->shopee_shop_id})");

            try {
                $this->syncShopOrders($platform, $days);
            } catch (\Exception $e) {
                $this->error("❌ เกิดข้อผิดพลาดร้าน {$platform->description}: " . $e->getMessage());
            }
        }

        $this->info('✅ จบการทำงาน Sync ออเดอร์ Shopee');
    }

    private function syncShopOrders($platform, $days)
    {
        $host = 'https://partner.shopeemobile.com';
        $pathList = '/api/v2/order/get_order_list';
        $pathDetail = '/api/v2/order/get_order_detail';

        $partnerId = (int) $platform->shopee_partner_id;
        $partnerKey = $platform->shopee_partner_key;
        $shopId = (int) $platform->shopee_shop_id;

        // เช็คและ Refresh Token (สมมติว่า accessToken ยังไม่หมดอายุ เพื่อความง่ายในสคริปต์นี้)
        $accessToken = $platform->accessToken;

        $timeTo = time();
        $timeFrom = $timeTo - ($days * 86400);

        // Shopee อนุญาตให้ดึง list ได้สูงสุดทีละ 15 วัน เราเลยต้อง Loop ทีละ 14 วัน
        $chunkDays = 14 * 86400;
        $allOrderSns = [];

        $this->output->progressStart((int)ceil(($timeTo - $timeFrom) / $chunkDays));

        // 1. กวาด Order SN ทั้งหมดมาก่อน
        for ($start = $timeFrom; $start < $timeTo; $start += $chunkDays) {
            $end = min($start + $chunkDays - 1, $timeTo);

            $timestamp = time();
            $sign = hash_hmac('sha256', $partnerId . $pathList . $timestamp . $accessToken . $shopId, $partnerKey);

            $query = [
                'partner_id'       => $partnerId,
                'timestamp'        => $timestamp,
                'sign'             => $sign,
                'shop_id'          => $shopId,
                'access_token'     => $accessToken,
                'time_range_field' => 'create_time',
                'time_from'        => $start,
                'time_to'          => $end,
                'page_size'        => 100,
            ];

            // Loop สำหรับ Pagination (ถ้าใน 14 วันมีออเดอร์เกิน 100)
            $cursor = "";
            do {
                if ($cursor) $query['cursor'] = $cursor;

                $url = $host . $pathList . '?' . http_build_query($query);
                $resp = Http::get($url)->json();

                if (!empty($resp['error'])) {
                    throw new \Exception("API Error (List): " . json_encode($resp));
                }

                $orders = $resp['response']['order_list'] ?? [];
                foreach ($orders as $o) {
                    $allOrderSns[] = $o['order_sn'];
                }

                $cursor = $resp['response']['next_cursor'] ?? "";
                $hasMore = $resp['response']['more'] ?? false;
            } while ($hasMore && $cursor);

            $this->output->progressAdvance();
        }
        $this->output->progressFinish();

        $this->info("📦 พบออเดอร์ทั้งหมด " . count($allOrderSns) . " รายการ กำลังดึงรายละเอียด...");

        // 2. นำ Order SN มาแบ่งก้อน (ก้อนละ 50) เพื่อดึงรายละเอียดและบันทึกลง DB
        $chunks = array_chunk($allOrderSns, 50);
        $this->output->progressStart(count($chunks));

        foreach ($chunks as $chunk) {
            $timestamp = time();
            $sign = hash_hmac('sha256', $partnerId . $pathDetail . $timestamp . $accessToken . $shopId, $partnerKey);

            $url = $host . $pathDetail . '?' . http_build_query([
                'partner_id'       => $partnerId,
                'timestamp'        => $timestamp,
                'sign'             => $sign,
                'shop_id'          => $shopId,
                'access_token'     => $accessToken,
                'order_sn_list'    => implode(',', $chunk),
                'response_optional_fields' => 'buyer_user_id,buyer_username,order_status,total_amount,currency,create_time,item_list'
            ]);

            $resp = Http::get($url)->json();

            if (empty($resp['error']) && !empty($resp['response']['order_list'])) {
                foreach ($resp['response']['order_list'] as $od) {
                    // 3. บันทึกลงตาราง orders
                    DB::table('orders')->updateOrInsert(
                        ['order_sn' => $od['order_sn']],
                        [
                            'platform'          => 'shopee',
                            'shop_id'           => (string)$shopId,
                            'buyer_user_id'     => (string)($od['buyer_user_id'] ?? ''),
                            'buyer_username'    => $od['buyer_username'] ?? null,
                            'order_status'      => $od['order_status'] ?? null,
                            'total_amount'      => (float)($od['total_amount'] ?? 0),
                            'currency'          => $od['currency'] ?? 'THB',
                            'order_create_time' => isset($od['create_time']) ? Carbon::createFromTimestamp($od['create_time']) : null,
                            'raw_data'          => json_encode($od, JSON_UNESCAPED_UNICODE),
                            'updated_at'        => now(),
                            'created_at'        => now(),
                        ]
                    );

                    // อัปเดตตารางลูกค้าเผื่อไว้ด้วย
                    if (!empty($od['buyer_user_id'])) {
                        DB::table('customers')
                            ->where('buyerId', null)
                            ->where('custId', 'like', $od['buyer_user_id'] . '%')
                            ->update(['buyerId' => $od['buyer_user_id']]);
                    }
                }
            }
            $this->output->progressAdvance();
        }
        $this->output->progressFinish();
    }
}
