<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PlatformAccessTokens;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;
use Lazada\LazopClient;
use Lazada\LazopRequest;

class SyncLazadaOrders extends Command
{
    // ชื่อคำสั่งสำหรับเรียกใช้ใน Terminal
    protected $signature = 'sync:lazada-orders {--days=90 : จำนวนวันย้อนหลัง}';
    protected $description = 'ดึงข้อมูลออเดอร์ Lazada ย้อนหลังทั้งหมดมาเก็บใน Database';

    public function handle()
    {
        $days = (int) $this->option('days');
        $this->info("🚀 เริ่มต้น Sync ออเดอร์ Lazada ย้อนหลัง {$days} วัน...");

        // ดึงร้านค้า Lazada ทั้งหมดที่มีในระบบ
        $platforms = PlatformAccessTokens::where('platform', 'lazada')->get();

        if ($platforms->isEmpty()) {
            $this->error('❌ ไม่พบร้านค้า Lazada ในระบบ');
            return;
        }

        foreach ($platforms as $platform) {
            $this->info("🛒 กำลังดึงข้อมูลร้าน: {$platform->description} (Seller ID: {$platform->laz_seller_id})");

            try {
                // อัปเดต Token ให้สดใหม่ก่อนเสมอ
                $platform = $this->refreshAccessTokenIfNeeded($platform);

                $this->syncShopOrders($platform, $days);
            } catch (\Exception $e) {
                $this->error("❌ เกิดข้อผิดพลาดร้าน {$platform->description}: " . $e->getMessage());
            }
        }

        $this->info('✅ จบการทำงาน Sync ออเดอร์ Lazada');
    }

    private function syncShopOrders($platform, $days)
    {
        $url = 'https://api.lazada.co.th/rest';
        $client = new LazopClient($url, $platform->laz_app_key, $platform->laz_app_secret);

        $timeTo = Carbon::now();
        $timeFrom = Carbon::now()->subDays($days);

        // Lazada อนุญาตให้ดึงข้อมูลออเดอร์ได้สูงสุดช่วงละไม่เกิน 15 วัน
        $chunkDays = 14;

        for ($start = clone $timeFrom; $start < $timeTo; $start->addDays($chunkDays)) {
            $end = (clone $start)->addDays($chunkDays);
            if ($end > $timeTo) {
                $end = clone $timeTo;
            }

            $this->info("📅 กำลังดึงช่วง: " . $start->format('Y-m-d') . " ถึง " . $end->format('Y-m-d'));

            $offset = 0;
            $limit = 100;
            $hasMore = true;

            while ($hasMore) {
                $req = new LazopRequest('/orders/get', 'GET');
                $req->addApiParam('created_after', $start->format('Y-m-d\TH:i:s+00:00'));
                $req->addApiParam('created_before', $end->format('Y-m-d\TH:i:s+00:00'));
                $req->addApiParam('limit', $limit);
                $req->addApiParam('offset', $offset);

                $response = $client->execute($req, $platform->accessToken);
                $result = json_decode($response, true);

                if (($result['code'] ?? '1') !== '0') {
                    $this->error("API Error: " . json_encode($result));
                    break;
                }

                $orders = $result['data']['orders'] ?? [];
                if (empty($orders)) {
                    $hasMore = false;
                    break;
                }

                $this->output->progressStart(count($orders));

                foreach ($orders as $order) {
                    $orderId = $order['order_id'];

                    // ต้องยิง API ดึง Item ทีละออเดอร์เพื่อเอา buyer_id
                    $reqItem = new LazopRequest('/order/items/get', 'GET');
                    $reqItem->addApiParam('order_id', $orderId);
                    $resItem = $client->execute($reqItem, $platform->accessToken);
                    $itemData = json_decode($resItem, true);

                    $items = [];
                    $buyerId = null;

                    if (($itemData['code'] ?? '1') === '0') {
                        $items = $itemData['data'] ?? [];
                        $buyerId = $items[0]['buyer_id'] ?? null;
                    }

                    // บันทึกลงตาราง orders
                    DB::table('orders')->updateOrInsert(
                        ['order_sn' => (string)$orderId],
                        [
                            'platform'          => 'lazada',
                            'shop_id'           => (string)$platform->laz_seller_id,
                            'buyer_user_id'     => (string)$buyerId,
                            'buyer_username'    => trim(($order['address_shipping']['first_name'] ?? '') . ' ' . ($order['address_shipping']['last_name'] ?? '')),
                            'order_status'      => $order['statuses'][0] ?? ($order['status'] ?? null),
                            'total_amount'      => (float)($order['price'] ?? 0) + (float)($order['shipping_fee'] ?? 0),
                            'currency'          => 'THB',
                            'order_create_time' => isset($order['created_at']) ? Carbon::parse($order['created_at']) : null,
                            'raw_data'          => json_encode([
                                'detail' => $order,
                                'items'  => $items
                            ], JSON_UNESCAPED_UNICODE),
                            'updated_at'        => now(),
                            'created_at'        => now(),
                        ]
                    );

                    $this->output->progressAdvance();
                }

                $this->output->progressFinish();

                if (count($orders) < $limit) {
                    $hasMore = false;
                } else {
                    $offset += $limit;
                }
            }
        }
    }

    private function refreshAccessTokenIfNeeded($platform, int $days = 3)
    {
        $expiredAt = $platform->expire_at ?? null;
        if (!$expiredAt || Carbon::parse($expiredAt)->diffInDays(Carbon::now()) <= $days) {
            $refreshToken = $platform->laz_refresh_token ?? null;
            if ($refreshToken) {
                $timestamp = round(microtime(true) * 1000);
                $params = [
                    'app_key'       => $platform->laz_app_key,
                    'refresh_token' => $refreshToken,
                    'timestamp'     => $timestamp,
                    'sign_method'   => 'sha256',
                ];

                ksort($params);
                $signString = '/auth/token/refresh';
                foreach ($params as $k => $v) {
                    $signString .= $k . $v;
                }
                $params['sign'] = strtoupper(hash_hmac('sha256', $signString, $platform->laz_app_secret));

                $response = Http::asForm()->post('https://auth.lazada.com/rest/auth/token/refresh', $params);
                if ($response->successful()) {
                    $data = $response->json();
                    if (isset($data['access_token'])) {
                        $platform->accessToken = $data['access_token'];
                        $platform->laz_refresh_token = $data['refresh_token'];
                        $platform->expire_at = now()->addSeconds($data['expires_in']);
                        $platform->save();
                        $this->info("🔄 Refresh Token สำเร็จ!");
                    }
                }
            }
        }
        return $platform;
    }
}
