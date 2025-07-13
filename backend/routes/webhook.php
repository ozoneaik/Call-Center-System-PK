<?php

use App\Http\Controllers\webhooks\new\LineWebhookController;
use Illuminate\Support\Facades\Route;

Route::prefix('webhook-main')->group(function(){

    // สำหรับ Line
    Route::post('/line', [LineWebhookController::class, 'webhook']);

    // สำหรับ Facebook
    Route::get('/webhook', function(){});
    Route::post('/webhook', function(){});

    // สำหรับ Lazada
    Route::post('/lazada', function(){});

    // สำหรับ Shopee
    Route::post('/shopee', function(){});

    // สำหรับ Test
    Route::get('/test', function(){});
    Route::post('/test', function(){});


});
