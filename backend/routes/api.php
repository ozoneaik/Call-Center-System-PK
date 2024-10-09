<?php


use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatRoomsController;
use App\Http\Controllers\CustomersController;
use App\Http\Controllers\DisplayController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotesController;
use App\Http\Controllers\ShortChatController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\UserAccess;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {

    // จัดการพนักงาน
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'user']);
    Route::prefix('users')->group(function () {
        Route::get('/list', [UserController::class, 'UserList']);
        Route::put('/update/{empCode}', [UserController::class, 'update']);
        Route::delete('/delete/{empCode}', [UserController::class, 'UserDelete']);
    });

    // จัดการลูกค้า
    Route::prefix('customers')->group(function () {
        Route::get('/list', [CustomersController::class, 'CustomerList']);
        Route::get('/detail/{custId}', [CustomersController::class, 'CustomerDetail']);
        Route::put('/update', [CustomersController::class, 'UpdateCustomer']);
    });

    // จัดการห้องแชท
    Route::prefix('chatRooms')->group(function () {
        Route::get('/list', [ChatRoomsController::class, 'list']);
        Route::post('/store', [ChatRoomsController::class, 'store']);
        Route::put('/update/{roomId}', [ChatRoomsController::class, 'update']);
        Route::delete('/delete/{roomId}', [ChatRoomsController::class, 'delete']);
    });

    // จัดการเกี่ยวกับแชท
    Route::prefix('messages')->group(function () {
        Route::post('/send', [MessageController::class, 'send']);
        Route::post('/receive', [MessageController::class, 'receive']);
        Route::post('/sendTo', [MessageController::class, 'sendTo']);
        Route::post('/endTalk', [MessageController::class, 'endTalk']);
    });

    // ดึงข้อมูลเกี่ยวกับแชท
    Route::prefix('display')->group(function () {
        Route::get('/message/list/{roomId}', [DisplayController::class, 'displayMessageList']);
        Route::post('/select/{custId}', [DisplayController::class, 'selectMessage']);
    });

    // จัดการข้อความส่งด่วน
    Route::prefix('shortChats')->group(function () {
        Route::get('/list', [ShortChatController::class, 'list']);
        Route::middleware(UserAccess::class)->group(function () {
            Route::post('/store', [ShortChatController::class, 'storeOrUpdate']);
            Route::delete('/delete/{id}', [ShortChatController::class, 'delete']);
        });
    });

    // จัดการ note
    Route::prefix('notes')->group(function () {
       Route::get('/list/{custId}', [NotesController::class, 'list']);
       Route::post('/store', [NotesController::class, 'store']);
       Route::put('/update/{noteId}', [NotesController::class, 'update']);
       Route::delete('/delete/{noteId}', [NotesController::class, 'delete']);
    });
});



