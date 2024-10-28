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
        return response()->json([
            'list' => $list['botMenu'],
            'chatRooms' => $list['chatRooms'],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $status = 400;
        $message = "เกิดข้อผิดพลาด";
        $detail = 'ไม่พบข้อผิดพลาด';
        try {
            $request->validate([
                'menuName' => 'required',
                'roomId' => 'required'
            ], [
                'menuName.required' => 'กรุณากรอกชื่อเมนู',
                'roomId.required' => 'กรุณากรอก Id ห้อง'
            ]);
            $store = $this->botService->store($request);
            if ($store['status']) {
                $message = 'สร้างเมนู BOT สำเร็จ';
                $status = 200;
            } else throw new \Exception($store['message']);
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

    public function update(Request $request,$id): JsonResponse
    {
        $status = 400;
        $message = "เกิดข้อผิดพลาด";
        $detail = 'ไม่พบข้อผิดพลาด';
        try {
            $request->validate([
                'menuName' => 'required',
                'roomId' => 'required'
            ], [
                'menuName.required' => 'กรุณากรอกชื่อเมนู',
                'roomId.required' => 'กรุณากรอก Id ห้อง'
            ]);
            $update = $this->botService->update($id, $request);
            if ($update['status']) {
                $message = 'อัพเดทเมนู BOT สำเร็จ';
                $status = 200;
            } else throw new \Exception($update['message']);
        }catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message,
                'detail' => $detail,
                'botMenu' => $update['botMenu'] ?? null
            ], $status);
        }
    }

    public function delete($id): JsonResponse{
        $status = 400;
        $message = "เกิดข้อผิดพลาด";
        $detail = 'ไม่พบข้อผิดพลาด';
        try {
            $delete = $this->botService->delete($id);
            if ($delete['status']) {
                $message = 'ลบ BOT สำเร็จ';
                $status = 200;
            } else throw new \Exception($delete['message']);
        }catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message,
                'detail' => $detail,
                'botMenu' => $delete['botMenu'] ?? null
            ], $status);
        }
    }
}
