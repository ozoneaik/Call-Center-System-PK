<?php

use App\Http\Controllers\Home\UserCase\UcClosureStatsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Home\UserCase\UcController;
use App\Http\Controllers\Home\UserCase\UcProgressController;
use App\Http\Controllers\Home\UserCase\UcSummaryController;
use App\Http\Controllers\Home\UserCase\UcTagSummaryController;

// จัดการหน้าหลัก

Route::prefix('/home')->group(function () {
    Route::prefix('user-case')->group(function () {
        Route::get('/', [UcSummaryController::class, 'index']);
        Route::get('/summary', [UcSummaryController::class, 'summary']);
        Route::get('/active-users', [UcSummaryController::class, 'activeUsersToday']);

        Route::get('/progress-detail/{empCode}', [UcProgressController::class, 'getProgressDetails']);

        Route::get('/tag-summary-today', [UcTagSummaryController::class, 'tagSummaryToday']);
        Route::get('/today-closed-tags', [UcTagSummaryController::class, 'todayClosedTags']);
        Route::get('/week-closed-tags', [UcTagSummaryController::class, 'weekClosedTags']);
        Route::get('/month-closed-tags', [UcTagSummaryController::class, 'monthClosedTags']);
        Route::get('/users/{empCode}/closed-today', [UcTagSummaryController::class, 'closedTodayByUser']);
        Route::get('/users/{empCode}/closed-week', [UcTagSummaryController::class, 'closedThisWeekByUser']);
        Route::get('/users/{empCode}/closed-month', [UcTagSummaryController::class, 'closedMonthByUser']);
        Route::get('/users/{empCode}/in-progress', [UcTagSummaryController::class, 'inProgressByUser']);
        Route::get('/users/{empCode}/forwarded-today', [UcTagSummaryController::class, 'forwardedByUser']);

        // Route::get('/users/{empCode}/tags/today',   [UcTagSummaryController::class, 'todayClosedTagsByUser']);
        // Route::get('/users/{empCode}/tags/week',    [UcTagSummaryController::class, 'weekClosedTagsByUser']);
        // Route::get('/users/{empCode}/tags/month',   [UcTagSummaryController::class, 'monthClosedTagsByUser']);

        Route::get('/closure-summary', [UcClosureStatsController::class, 'caseClosureTimeSummary']);
        Route::get('/closure-stats', [UcClosureStatsController::class, 'closureStats']);
        Route::get('/closure-range-stats', [UcClosureStatsController::class, 'closureRangeStats']);
        Route::get('/after-hour-closure-stats', [UcClosureStatsController::class, 'afterHourClosureStats']);
        Route::get('/after-hour-closure-range-stats', [UcClosureStatsController::class, 'afterHourClosureRangeStats']);
    });
});
