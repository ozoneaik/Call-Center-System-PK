<?php

namespace App\Http\Controllers;

use App\Models\PlatformAccessTokens;
use App\Services\TokenService;
use Illuminate\Database\QueryException;
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
        // $req = $request->all();
        // return response()->json([
        //     'request' => $req,
        //     'laz_app_key'=> $req['laz_app_key'] ?? null,
        // ], 400);
        try {
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
            if ($request->get('platform') === 'shopee') {
                $store->shopee_partner_id = $request->get('shopee_partner_id');
                $store->shopee_partner_key = $request->get('shopee_partner_key');
                $store->shopee_shop_id = $request->get('shopee_shop_id');
                $store->shopee_refresh_token = $request->get('shopee_refresh_token');
                // 'accessToken' จะถูกใช้เป็น shopee_access_token
            }
            $store->save();
            return response()->json([
                'message' => 'สร้าง token สำเร็จ',
                'detail' => 'ไม่พบข้อผิดพลาด',
                'Id' => $store->id
            ]);
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'เกิดข้อผิดพลาด',
                'detail' => "ฐานข้อมูลไม่ถูกต้อง",
                'error_detail' => $e->getMessage()
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'เกิดข้อผิดพลาด',
                'detail' => $e->getMessage()
            ], 400);
        }
    }

    // public function update(Request $request): JsonResponse
    // {
    //     try {
    //         $update = PlatformAccessTokens::findOrFail($request['id']);
    //         $update['accessToken'] = $request->get('accessToken');
    //         $update['description'] = $request->get('description');
    //         $update['platform'] = $request->get('platform');
    //         if ($request->get('platform') === 'facebook') {
    //             $store['fb_page_id'] = $request->get('fb_page_id');
    //         } else {
    //         }

    //         // --- เพิ่มเงื่อนไขสำหรับ Lazada ---
    //         if ($request->get('platform') === 'lazada') {
    //             $update->app_key = $request->get('laz_app_key');
    //             $update->app_secret = $request->get('laz_app_secret');
    //         }

    //         if ($request->get('platform') === 'shopee') {
    //             $update->shopee_partner_id = $request->get('shopee_partner_id');
    //             $update->shopee_partner_key = $request->get('shopee_partner_key');
    //             $update->shopee_shop_id = $request->get('shopee_shop_id');
    //             $update->shopee_refresh_token = $request->get('shopee_refresh_token');
    //         }
    //         $update->save();
    //         return response()->json([
    //             'message' => 'อัพเดทสำเร็จ',
    //             'detail' => 'ไม่พบข้อผิดพลาด'
    //         ]);
    //     } catch (QueryException $e) {
    //         return response()->json([
    //             'message' => 'เกิดข้อผิดพลาด',
    //             'detail' => "ฐานข้อมูลไม่ถูกต้อง"
    //         ], 400);
    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'message' => 'เกิดข้อผิดพลาด',
    //             'detail' => $e->getMessage()
    //         ], 400);
    //     }
    // }

    public function update(Request $request): JsonResponse
    {
        try {
            // Validate that an ID is provided
            $request->validate(['id' => 'required|exists:platform_access_tokens,id']);

            $update = PlatformAccessTokens::findOrFail($request->input('id'));

            // Update common fields
            $update->fill($request->only(['accessToken', 'description', 'platform']));

            // Update platform-specific fields
            if ($request->input('platform') === 'facebook') {
                $update->fb_page_id = $request->input('fb_page_id');
            }

            if ($request->input('platform') === 'lazada') {
                // CORRECTED property names
                $update->laz_app_key = $request->input('laz_app_key');
                $update->laz_app_secret = $request->input('laz_app_secret');
            }

            if ($request->input('platform') === 'shopee') {
                $update->shopee_partner_id = $request->input('shopee_partner_id');
                $update->shopee_partner_key = $request->input('shopee_partner_key');
                $update->shopee_shop_id = $request->input('shopee_shop_id');
                $update->shopee_refresh_token = $request->input('shopee_refresh_token');
            }

            $update->save();

            return response()->json([
                'message' => 'อัพเดทสำเร็จ',
                'detail' => 'ไม่พบข้อผิดพลาด'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'ข้อมูลไม่ถูกต้อง',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'ไม่พบข้อมูล Token',
                'detail' => 'The provided ID was not found.'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'เกิดข้อผิดพลาดไม่คาดคิด',
                'detail' => $e->getMessage()
            ], 500);
        }
    }

    public function delete($id): JsonResponse
    {
        PlatformAccessTokens::findOrFail($id)->delete();
        return response()->json([
            'message' => 'ลบ token สำเร็จ'
        ]);
    }
}
