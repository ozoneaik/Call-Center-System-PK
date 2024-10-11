<?php

namespace App\Http\Controllers;

use App\Models\PlatformAccessTokens;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class TokenController extends Controller
{
    public function list(): JsonResponse
    {
        $token = PlatformAccessTokens::all();
        return response()->json([
            'message' => 'success',
            'tokens' => $token
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $store = new PlatformAccessTokens();
        $store['accessTokenId'] = Hash::make(rand(0, 10000));
        $store['accessToken'] = $request->get('accessToken');
        $store['description'] = $request->get('description');
        $store['platform'] = $request->get('platform');
        $store->save();
        return response()->json([
            'message' => 'สร้าง token สำเร็จ',
            'detail' => 'ไม่พบข้อผิดพลาด',
            'Id' => $store->id
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $update = PlatformAccessTokens::findOrFail(request('id'));
        $update['accessToken'] = $request->get('accessToken');
        $update['description'] = $request->get('description');
        $update['platform'] = $request->get('platform');
        $update->save();
        return response()->json([
            'message' => 'อัพเดทสำเร็จ',
            'detail' => 'ไม่พบข้อผิดพลาด'
        ]);
    }

    public function delete($id) : JsonResponse{
        PlatformAccessTokens::findOrFail($id)->delete();
        return response()->json([
            'message' => 'ลบ token สำเร็จ'
        ]);
    }
}
