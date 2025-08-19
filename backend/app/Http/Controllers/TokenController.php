<?php

namespace App\Http\Controllers;

use App\Models\PlatformAccessTokens;
use App\Services\TokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class TokenController extends Controller
{

    protected TokenService $tokenService;

    public function __construct(TokenService $tokenService)
    {
        $this->tokenService = $tokenService;
    }

    public function verifyToken(Request $request): JsonResponse
    {
        $request->validate(['token' => 'required'], ['token.required' => 'กรุณากรอก Token']);
        $status = 400;
        $message = 'เกิดข้อผิดพลาด';
        $detail = 'ไม่พบข้อผิดพลาด';
        try {
            $checkToken = $this->tokenService->checkVerifyToken($request['token']);
            if ($checkToken['status']) {
                $message = 'ตรวจสอบสำเร็จ';
                $status = 200;
            } else throw new \Exception($checkToken['message']);
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message,
                'detail' => $detail,
            ], $status);
        }
    }

    public function list(): JsonResponse
    {
        $token = PlatformAccessTokens::orderBy('id', 'asc')->get();
        return response()->json([
            'message' => 'success',
            'tokens' => $token
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        // return response()->json([
        //     'message' => 'สร้าง token สำเร็จ',
        //     'detail' => $request->all(),
        // ], 400);
        $store = new PlatformAccessTokens();
        $store['accessTokenId'] = Hash::make(rand(0, 10000));
        $store['accessToken'] = $request->get('accessToken');
        $store['description'] = $request->get('description');
        $store['platform'] = $request->get('platform');
        if ($request->get('platform') === 'facebook') {
            $store['fb_page_id'] = $request->get('fb_page_id');
        } else {
        }
        // --- เพิ่มเงื่อนไขสำหรับ Lazada ---
        if ($request->get('platform') === 'lazada') {
            $store->laz_app_key = $request->get('laz_app_key');
            $store->laz_app_secret = $request->get('laz_app_secret');
        } else {
        }
        $store->save();
        return response()->json([
            'message' => 'สร้าง token สำเร็จ',
            'detail' => 'ไม่พบข้อผิดพลาด',
            'Id' => $store->id
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $update = PlatformAccessTokens::findOrFail($request['id']);
        $update['accessToken'] = $request->get('accessToken');
        $update['description'] = $request->get('description');
        $update['platform'] = $request->get('platform');
        if ($request->get('platform') === 'facebook') {
            $update['fb_page_id'] = $request->get('fb_page_id');
        }

        // --- เพิ่มเงื่อนไขสำหรับ Lazada ---
        if ($request->get('platform') === 'lazada') {
            $update->laz_app_key = $request->get('laz_app_key');
            $update->laz_app_secret = $request->get('laz_app_secret');
        }
        $update->save();
        return response()->json([
            'message' => 'อัพเดทสำเร็จ',
            'detail' => 'ไม่พบข้อผิดพลาด'
        ]);
    }

    public function delete($id): JsonResponse
    {
        PlatformAccessTokens::findOrFail($id)->delete();
        return response()->json([
            'message' => 'ลบ token สำเร็จ'
        ]);
    }
}
