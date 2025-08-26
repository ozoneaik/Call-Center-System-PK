<?php

use App\Http\Controllers\webhooks\LazadaToken;
use App\Http\Controllers\webhooks\new\FacebookController;
use App\Http\Controllers\webhooks\new\LazadaController;
use App\Http\Controllers\webhooks\new\LineWebhookController;
use App\Http\Controllers\webhooks\new\NewLazadaController;
use App\Http\Controllers\webhooks\new\ShopeeController;
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
    });

    // สำหรับ Shopee
    Route::prefix('shopee')->group(function () {
        Route::post('/', [ShopeeController::class, 'webhook']);
        Route::get('/', [ShopeeController::class, 'index']);
        Route::get('/auth', [ShopeeController::class, 'authorization']);
        Route::get('/send-message', [ShopeeController::class, 'send_message']);
    });

    // สำหรับ Test
    Route::prefix('test')->group(function () {
        Route::get('/', function () {});
        Route::post('/', function () {});
    });
});
