<?php

use App\Http\Controllers\webhooks\new\FacebookController;
use App\Http\Controllers\webhooks\new\LazadaController;
use App\Http\Controllers\webhooks\new\LineWebhookController;
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
        Route::post('/', [FacebookController::class,'webhook']);
    });

    // สำหรับ Lazada
    Route::prefix('lazada')->group(function () {
        Route::get('/', [LazadaController::class,'webhookGET']);
        Route::post('/', [LazadaController::class,'webhookPOST']);
    });

    // สำหรับ Shopee
    Route::prefix('shopee')->group(function () {
        Route::post('/', function () {});
    });

    // สำหรับ Test
    Route::prefix('test')->group(function () {
        Route::get('/', function () {});
        Route::post('/', function () {});
    });
});
