<?php

use App\Http\Controllers\webhooks\LazadaToken;
use App\Http\Controllers\webhooks\new\FacebookController;
use App\Http\Controllers\webhooks\new\LineWebhookController;
use App\Http\Controllers\webhooks\new\NewLazadaController;
use App\Http\Controllers\webhooks\new\ShopeeController;
use App\Http\Controllers\webhooks\new\NewShopeeController;
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
        Route::post('/', [NewLazadaController::class, 'webhook']);

        Route::post('/auth', [LazadaToken::class, 'getAccessToken']);

        Route::post('/refresh-token', [LazadaToken::class, 'refreshToken']);
        Route::post('/send-message', [LazadaToken::class, 'sendMessage']); //สำหรับทดสอบเฉยๆ
    });

    // สำหรับ Shopee
    Route::prefix('shopee')->group(function () {
        Route::post('/', [NewShopeeController::class, 'webhooks']);
        Route::post('/verify', [NewShopeeController::class, 'verify']);

        Route::get('/', [ShopeeController::class, 'index']);
        Route::post('/refresh-token', [ShopeeController::class, 'refreshToken']);

        Route::post('/auth', [ShopeeController::class, 'authorization']);
    });

    // สำหรับ Test
    Route::prefix('test')->group(function () {
        Route::get('/', function () {});
        Route::post('/', function () {});
    });
});
