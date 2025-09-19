<?php

namespace App\Http\Controllers;

use App\Services\BotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BotMenuController extends Controller
{
    protected BotService $botService;

    public function __construct(BotService $botService)
    {
        $this->botService = $botService;
    }

    public function list(): JsonResponse
    {
        $list = $this->botService->list();
        //        return response()->json($list);
        // สร้างผลลัพธ์สำหรับ botMenu โดยจัดกลุ่มตาม botTokenId
        $botMenuResult = $list['botMenu']->map(function ($menus, $botTokenId) {
            // ดึงข้อมูล description ครั้งเดียวต่อ botTokenId
            $description = $menus->first()->description;
            $platform = $menus->first()->platform;
            // ลบ description ในรายการย่อยแต่ละรายการ
            if (count($menus) === 0) {
                $cleanedMenus = [];
            } else {
                $cleanedMenus = $menus->map(function ($menu) {
                    unset($menu['description']);
                    return $menu;
                })->filter(function ($menu) {
                    return isset($menu['id']); // เก็บเฉพาะเมนูที่มี id
                });
            }
            return [
                'botTokenId' => $botTokenId,
                'description' => $description,
                'platform' => $platform,
                'list' => $cleanedMenus->values()->all(),
            ];
        })->values()->all();
        return response()->json([
            'list' => $botMenuResult,
            'chatRooms' => $list['chatRooms'],
        ]);
    }

    public function storeOrUpdate(Request $request): JsonResponse
    {
        $status = 400;
        $message = "เกิดข้อผิดพลาด";
        $detail = 'ไม่พบข้อผิดพลาด';
        try {
            if ($request['bot']['list']) {
                if (count($request['bot']['list']) > 4) {
                    throw new \Exception('ขณะนี้ไม่สามารถเพิ่มรายการได้มากกว่า 4 รายการ');
                } else {
                    $store = $this->botService->storeOrUpdate($request['bot']);
                    if ($store['status']) {
                        $message = 'สร้างเมนู BOT สำเร็จ';
                        $status = 200;
                    } else throw new \Exception($store['message']);
                }
            } else {
                throw new \Exception('ไม่พบรายการที่ต้องการจัดการ');
            }
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message,
                'detail' => $detail,
                'botMenu' => $store['botMenu'] ?? null
            ], $status);
        }
    }
}
