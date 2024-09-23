<?php

use App\Http\Controllers\ActiveConversationsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatHistoryController;
use App\Http\Controllers\ChatRoomsController;
use App\Http\Controllers\CustomersController;
use App\Http\Controllers\line\LineController;
use App\Http\Controllers\ShortChatController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    // จัดการ User
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'user']);
    Route::prefix('user')->group(function () {
        Route::get('/list', [UserController::class, 'UserList']);
        Route::post('/delete', [UserController::class, 'UserDelete']);
    });
    // จัดการลูกค้า
    Route::prefix('customer')->group(function () {
        Route::get('/list', [CustomersController::class, 'CustomerList']);
        Route::get('/list/CustomerListNewDm/{roomId}', [CustomersController::class, 'CustomerListNewDm']);
        Route::get('/detail/{custId}',[CustomersController::class, 'CustomerDetail']);
        Route::post('/update',[CustomersController::class, 'UpdateCustomer']);
        Route::post('/changeRoom',[CustomersController::class, 'changeRoom']);
        Route::post('/changeUserReply',[CustomersController::class, 'changeUserReply']);

    });
    // จัดการแชท
    Route::prefix('chatRoom')->group(function(){
       Route::get('/list',[ChatRoomsController::class,'list']);
    });
    Route::prefix('messages')->group(function () {
        Route::get('/selectMessage/{id}', [ChatHistoryController::class, 'ChatSelectById']);
        Route::post('/receive',[ActiveConversationsController::class, 'receive']);
        Route::post('/endTalk', [ActiveConversationsController::class, 'endTalk']);
    });
    Route::post('/sendMessage', [LineController::class, 'sendMessage']);
    Route::prefix('shortChat')->group(function () {
        Route::get('/list', [ShortChatController::class, 'shortChatList']);
    });
});

Route::post('/line/webhook', [LineController::class, 'webhook']);


