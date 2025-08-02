<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Home\UserCase\UcController;

// จัดการหน้าหลัก

Route::prefix('/home')->group(function () {
    Route::prefix('user-case')->group(function () {
        Route::get('/', [UcController::class, 'index'])->name('home.user.case.index');
        Route::post('/', function () {
            return response()->json([
                'message' => 'hello'
            ]);
        });
        Route::get('/summary', [UcController::class, 'summary']);
        Route::get('/active-users', [UcController::class, 'activeUsersToday']);
    });
});
