<?php

namespace App\Http\Controllers;

use App\Models\PlatformAccessTokens;
use App\Services\TikTokShopService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * หน้า "TikTok Shop" — แสดงออเดอร์/สินค้าจากร้าน TikTok ที่เชื่อมผ่านหน้า Auto Access Token
 */
class TikTokShopController extends Controller
{
    public function __construct(protected TikTokShopService $service)
    {
    }

    /** ร้าน TikTok ที่เชื่อมไว้ (ไม่ส่ง token/secret ออกไป) */
    public function accounts(): JsonResponse
    {
        $accounts = $this->tiktokTokens()
            ->orderBy('id')
            ->get(['id', 'description', 'tiktok_seller_name', 'tiktok_region', 'expire_at', 'updated_at']);

        return response()->json(['message' => 'success', 'accounts' => $accounts]);
    }

    public function shops($id): JsonResponse
    {
        return $this->respond(fn () => ['shops' => array_map(
            fn ($s) => collect($s)->except('cipher')->all(),
            $this->service->shops($this->findToken($id))
        )]);
    }

    public function orders($id, Request $request): JsonResponse
    {
        return $this->respond(fn () => $this->service->orders($this->findToken($id), $request->query('page_token')));
    }

    public function products($id, Request $request): JsonResponse
    {
        return $this->respond(fn () => $this->service->products($this->findToken($id), $request->query('page_token')));
    }

    private function tiktokTokens()
    {
        // ฟอร์มจัดการ token เดิมบันทึก platform เป็น "Tiktok" — เทียบแบบไม่สนตัวพิมพ์
        return PlatformAccessTokens::query()
            ->whereRaw('LOWER(platform) = ?', ['tiktok'])
            ->whereNotNull('tiktok_app_key')
            ->whereNotNull('tiktok_app_secret');
    }

    private function findToken($id): PlatformAccessTokens
    {
        return $this->tiktokTokens()->findOrFail($id);
    }

    private function respond(callable $fn): JsonResponse
    {
        try {
            return response()->json(['message' => 'success'] + $fn());
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'ไม่พบร้าน TikTok นี้', 'detail' => 'ไม่พบข้อมูล token'], 404);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'ดึงข้อมูลจาก TikTok ไม่สำเร็จ', 'detail' => $e->getMessage()], 400);
        }
    }
}
