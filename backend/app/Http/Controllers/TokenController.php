<?php

namespace App\Http\Controllers;

use App\Models\BotMenu;
use App\Models\ChatRooms;
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

    public function list(): JsonResponse
    {
        try {
            $token = PlatformAccessTokens::orderBy('id', 'asc')->get();
            $chat_rooms = ChatRooms::query()->where('is_active', true)->get();
            return response()->json([
                'message' => 'success',
                'tokens' => $token,
                'chat_rooms' => $chat_rooms
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'tokens' => [],
                'chat_rooms' => []
            ], 400);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $store = new PlatformAccessTokens();
        $store['accessTokenId'] = Hash::make(rand(0, 10000));
        $store['accessToken'] = $request->get('accessToken');
        $store['description'] = $request->get('description');
        $store['platform'] = $request->get('platform');
        $store['room_default_id'] = $request->get('default_room_id') ?? 'ROOM99';
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

        try {
            BotMenu::create([
                'menuName' => 'สนทนากับแอดมิน',
                'roomId' => $store['room_default_id'],
                'botTokenId' => $store['id'],
                'menu_number' => 1
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'ไม่สามารถสร้างเมนูได้',
                'detail' => $e->getMessage(),
            ], 400);
        }

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
