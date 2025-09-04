<?php

use App\Http\Controllers\Ai\Line\LineAiController;
use Illuminate\Support\Facades\Route;

Route::prefix('ai')->group(function(){
    Route::post('/line',[LineAiController::class,'index']);
});

