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
        Route::get('/customer-orders/{custId}', [NewLazadaController::class, 'customerOrders']);
    });

    // สำหรับ Shopee
    Route::prefix('shopee')->group(function () {
        // Route::post('/', [ShopeeController::class, 'webhook']);
        Route::get('/', [ShopeeController::class, 'index']);
        Route::get('/auth', [ShopeeController::class, 'authorization']);
        Route::post('/', [NewShopeeController::class, 'webhooks']);

      Route::get('/customer-orders/{custId}', [NewShopeeController::class, 'customerOrders']);

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
