<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatHistoryController;
use App\Http\Controllers\CustomersController;
use App\Http\Controllers\line\LineController;
use App\Http\Controllers\ShortChatController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {

    Route::prefix('customer')->group(function () {
        Route::get('/list', [CustomersController::class, 'CustomerList']);
    });

    Route::prefix('messages')->group(function () {
       Route::get('/listMessage',[ChatHistoryController::class, 'LatestChatHistory']);
       Route::get('/selectMessage/{id}',[ChatHistoryController::class, 'ChatSelectById']);
    });

    Route::post('/sendMessage', [LineController::class, 'sendMessage']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'user']);
    Route::prefix('user')->group(function () {
       Route::get('/list',[UserController::class,'UserList']);
    });

    Route::prefix('shortChat')->group(function(){
       Route::get('/list',[ShortChatController::class,'shortChatList']);
    });
});

Route::post('/line/webhook', [LineController::class, 'webhook']);


