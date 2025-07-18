<?php

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
        Route::get('/', function () {});
        Route::post('/', function () {});
    });

    // สำหรับ Lazada
    Route::prefix('lazada')->group(function () {
        Route::get('/', [LazadaController::class,'webhookGET']);
        Route::post('/', [LazadaController::class,'webhookPOST']);
    });


    // https://auth.lazada.com/oauth/authorize?response_type=code&force_auth=true&redirect_uri=https://a3d070ef0e5a.ngrok-free.app/api/webhook-new/lazada&client_id=132189


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
