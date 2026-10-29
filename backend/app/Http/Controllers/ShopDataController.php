<?php

namespace App\Http\Controllers;

use App\Models\PlatformAccessTokens;
use App\Services\LazadaShopService;
use App\Services\ShopeeShopService;
use App\Services\TikTokShopService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * หน้า "ข้อมูลร้าน" (TikTok / Shopee / Lazada) — แสดงออเดอร์/สินค้าจากร้านที่เชื่อม token ไว้
 * platform มาจาก route defaults ใน routes/api.php
 */
class ShopDataController extends Controller
{
    /** platform => [service, คอลัมน์ credential ที่ต้องมีครบ] */
    private const PLATFORMS = [
        'tiktok' => [TikTokShopService::class, ['tiktok_app_key', 'tiktok_app_secret']],
        'shopee' => [ShopeeShopService::class, ['shopee_partner_id', 'shopee_partner_key', 'shopee_shop_id']],
        'lazada' => [LazadaShopService::class, ['laz_app_key', 'laz_app_secret']],
    ];

    /** ร้านที่เชื่อมไว้ (ไม่ส่ง token/secret ออกไป) */
    public function accounts(Request $request): JsonResponse
    {
        $accounts = $this->tokens($request)
            ->orderBy('id')
            ->get(['id', 'description', 'tiktok_seller_name', 'tiktok_region', 'shopee_shop_id', 'laz_seller_id', 'expire_at', 'updated_at']);

        return response()->json(['message' => 'success', 'accounts' => $accounts]);
    }

    public function shops(Request $request, $id): JsonResponse
    {
        return $this->respond(fn () => ['shops' => array_map(
            fn ($s) => collect($s)->except('cipher')->all(),
            $this->service($request)->shops($this->findToken($request, $id))
        )]);
    }

    public function orders(Request $request, $id): JsonResponse
    {
        return $this->respond(fn () => $this->service($request)->orders($this->findToken($request, $id), $request->query('page_token')));
    }

    public function products(Request $request, $id): JsonResponse
    {
        return $this->respond(fn () => $this->service($request)->products($this->findToken($request, $id), $request->query('page_token')));
    }

    private function platform(Request $request): string
    {
        $platform = $request->route('platform');
        abort_unless(isset(self::PLATFORMS[$platform]), 404);
        return $platform;
    }

    private function service(Request $request): TikTokShopService|ShopeeShopService|LazadaShopService
    {
        return app(self::PLATFORMS[$this->platform($request)][0]);
    }

    private function tokens(Request $request)
    {
        $platform = $this->platform($request);
        // ฟอร์มจัดการ token เดิมบันทึก platform เป็น "Tiktok" — เทียบแบบไม่สนตัวพิมพ์
        $query = PlatformAccessTokens::query()->whereRaw('LOWER(platform) = ?', [$platform]);
        foreach (self::PLATFORMS[$platform][1] as $column) $query->whereNotNull($column);
        return $query;
    }

    private function findToken(Request $request, $id): PlatformAccessTokens
    {
        return $this->tokens($request)->findOrFail($id);
    }

    private function respond(callable $fn): JsonResponse
    {
        try {
            return response()->json(['message' => 'success'] + $fn());
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'ไม่พบร้านนี้', 'detail' => 'ไม่พบข้อมูล token'], 404);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'ดึงข้อมูลจากแพลตฟอร์มไม่สำเร็จ', 'detail' => $e->getMessage()], 400);
        }
    }
}
