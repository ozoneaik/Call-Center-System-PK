<?php

use App\Http\Controllers\ImagePredictController;
use App\Http\Controllers\PlatformTokenController;
use App\Http\Controllers\webhooks\new\FacebookController;
use App\Http\Controllers\webhooks\new\LineWebhookController;
use App\Http\Controllers\webhooks\new\NewLazadaController;
use App\Http\Controllers\webhooks\new\ShopeeController;
use App\Http\Controllers\webhooks\new\NewShopeeController;
use App\Http\Controllers\webhooks\new\NewTikTokController;
use App\Http\Controllers\webhooks\new\ShopeeLiveController;
use App\Http\Controllers\webhooks\new\TikTokLiveController;
use Illuminate\Support\Facades\Route;

/**
 * เริ่มต้น URL ===> 'localhost/webhook-new/{endpoint} 🌐
 */

Route::prefix('webhook-new')->group(function () {

    // สำหรับ Line
    Route::prefix('line')->group(function () {
        Route::post('/', [LineWebhookController::class, 'webhook']);
        // Route::post('line-entry', [LineWebhookController::class, 'entryWebhook']);
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
        Route::post('/refresh', [PlatformTokenController::class, 'shopeeRefresh']);

        Route::get('/customer-orders/{custId}', [NewShopeeController::class, 'customerOrders']);
        Route::get('/sync-chat-history/{custId}', [NewShopeeController::class, 'syncCustomerChatHistoryManual']);
        Route::post('/test-order', [NewShopeeController::class, 'testOrderDetail']);
        // Route::get('/test-order', [NewShopeeController::class, 'testOrderDetail']);

        Route::post('/create-session', [ShopeeLiveController::class, 'shopeeCreateLiveSession']);
        Route::post('/start-session', [ShopeeLiveController::class, 'shopeeStartLiveSession']);
        Route::get('/get-session-detail', [ShopeeLiveController::class, 'shopeeGetSessionDetail']);
        Route::post('/end-session', [ShopeeLiveController::class, 'shopeeEndLiveSession']);
        Route::post('/add-item-list', [ShopeeLiveController::class, 'shopeeAddItemList']);
        Route::post('/get-item-list', [ShopeeLiveController::class, 'shopeeGetItemList']);
        Route::post('/get-session-metric', [ShopeeLiveController::class, 'shopeeGetSessionMetric']);
        Route::post('/get-session-item-metric', [ShopeeLiveController::class, 'shopeeGetSessionItemMetric']);
        Route::post('/post-comment', [ShopeeLiveController::class, 'shopeePostComment']);
        Route::post('/get-latest-comment-list', [ShopeeLiveController::class, 'shopeeGetLatestCommentList']);
    });

    Route::prefix('tiktok')->group(function () {
        // Route::post('/', [TikTokLiveController::class, 'webhooksLive']);

        // Route::post('/', [NewTikTokController::class, 'webhooks']);
        // Route::get('/shops', [NewTikTokController::class, 'getAuthorizedShops']);
        // Route::post('/shop-webhooks', [NewTikTokController::class, 'getShopWebhooks']);

        // Route::post('/webhook', [NewTikTokController::class, 'handleWebhook']);
    });

    // สำหรับ Test
    Route::prefix('test')->group(function () {
        Route::get('/', function () {});
        Route::post('/', function () {});
    });

    //สำหรับวิเคราะห์เคสสแปม
    // Route::prefix('predict')->group(function () {
    //     Route::post('/url', [ImagePredictController::class, 'predictFromUrl']);
    //     Route::post('/upload', [ImagePredictController::class, 'predictUpload']);
    // });
});
