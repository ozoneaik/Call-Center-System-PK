<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\line\LineController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
   Route::post('/logout', [AuthController::class, 'logout']);
   Route::get('/user', [AuthController::class, 'user']);
});

Route::post('/line/webhook',[LineController::class, 'webhook']);
