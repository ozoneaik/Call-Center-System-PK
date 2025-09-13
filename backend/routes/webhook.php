<?php

use App\Http\Controllers\PlatformTokenController;
use App\Http\Controllers\webhooks\new\FacebookController;
use App\Http\Controllers\webhooks\new\LineWebhookController;
use App\Http\Controllers\webhooks\new\NewLazadaController;
use App\Http\Controllers\webhooks\new\ShopeeController;
use App\Http\Controllers\webhooks\new\NewShopeeController;
use App\Http\Controllers\webhooks\new\NewTikTokController;
use App\Http\Controllers\webhooks\new\TikTokLiveController;
use Illuminate\Support\Facades\Route;

/**
 * เริ่มต้น URL ===> 'localhost/webhook-new/{endpoint} 🌐
 */

Route::prefix('webhook-new')->group(function () {

    // สำหรับ Line
    Route::prefix('line')->group(function () {
        Route::post('/', [LineWebhookController::class, 'webhook']);
    });

    // สำหรับ Facebook
    Route::prefix('facebook')->group(function () {
        Route::get('/', [FacebookController::class, 'verifyToken']);
        Route::post('/', [FacebookController::class, 'webhook']);
    });

    // สำหรับ Lazada
    Route::prefix('lazada')->group(function () {
        // Route::get('/', [LazadaController::class, 'webhook']);
        Route::post('/', [NewLazadaController::class, 'webhook']);
        Route::post('/refresh-token', [NewLazadaController::class, 'refreshToken']);

        Route::get('/resolve-platform', [NewLazadaController::class, 'resolvePlatform']); //ตรวจสอบว่า ลูกค้าคนนี้อยู่กับ platform Lazada ไหน (ร้านไหน) และ return ข้อมูลร้านกลับมา
        Route::get('/orders-by-session', [NewLazadaController::class, 'ordersBySession']); //ใช้ ิbuyer id  ของแชท Lazada ดึงประวัติคำสั่งซื้อของลูกค้าคนนั้น (ภายในช่วงเวลาที่กำหนด เช่น 30 วัน)
        Route::get('/order-detail', [NewLazadaController::class, 'orderDetail']); //ดึงรายละเอียดคำสั่งซื้อจาก Lazada API
    });

    // สำหรับ Shopee
    Route::prefix('shopee')->group(function () {
        // Route::post('/', [ShopeeController::class, 'webhook']);
        Route::get('/', [ShopeeController::class, 'index']);
        Route::get('/auth', [ShopeeController::class, 'authorization']);
        Route::post('/', [NewShopeeController::class, 'webhooks']);

        Route::get('/resolve-platform', [NewShopeeController::class, 'resolvePlatform']); //ตรวจสอบว่า ลูกค้าคนนี้อยู่กับ platform Shopee ร้านไหน
        Route::get('/orders-by-buyer', [NewShopeeController::class, 'ordersByBuyer']); //ใช้ buyer_id หรือ buyer_username เพื่อดึงประวัติคำสั่งซื้อของลูกค้าคนนั้นจาก Shopee API
        Route::get('/order-detail', [NewShopeeController::class, 'orderDetail']); //ใช้ order_sn (Shopee order serial number) เพื่อดึงรายละเอียดคำสั่งซื้อ
    });

    Route::prefix('tiktok')->group(function () {
        // Route::post('/', [TikTokLiveController::class, 'webhooksLive']);

        Route::post('/', [NewTikTokController::class, 'webhooks']);
        Route::get('/shops', [NewTikTokController::class, 'getAuthorizedShops']);
        Route::post('/shop-webhooks', [NewTikTokController::class, 'getShopWebhooks']);

    });

    // สำหรับ Test
    Route::prefix('test')->group(function () {
        Route::get('/', function () {});
        Route::post('/', function () {});
    });
});
