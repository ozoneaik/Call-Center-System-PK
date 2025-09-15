<?php

use App\Http\Controllers\Home\UserCase\Reports\ClosedCasesController;
use App\Http\Controllers\Home\UserCase\Reports\ClosureCompareController;
use App\Http\Controllers\Home\UserCase\Reports\ExportExcelController;
use App\Http\Controllers\Home\UserCase\Reports\InProgressController;
use App\Http\Controllers\Home\UserCase\Reports\PendingController;
use App\Http\Controllers\Home\UserCase\Reports\StatisticsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Home\UserCase\UcController;
use App\Http\Controllers\Home\UserCase\UcProgressController;
use App\Http\Controllers\Home\UserCase\UcSummaryController;
use App\Http\Controllers\Home\UserCase\UcTagSummaryController;

Route::prefix('/home')->group(function () {
    Route::prefix('user-case')->group(function () {
        Route::get('/', [UcSummaryController::class, 'index']);
        Route::get('/summary', [UcSummaryController::class, 'summary']);
        Route::get('/active-users', [UcSummaryController::class, 'activeUsersToday']);

        Route::get('/tags', [UcTagSummaryController::class, 'tags']);
        Route::get('/tag-summary-today', [UcTagSummaryController::class, 'tagSummaryToday']);
        Route::get('/today-closed-tags', [UcTagSummaryController::class, 'todayClosedTags']);
        Route::get('/week-closed-tags', [UcTagSummaryController::class, 'weekClosedTags']);
        Route::get('/month-closed-tags', [UcTagSummaryController::class, 'monthClosedTags']);
        Route::get('/users/{empCode}/closed-today', [UcTagSummaryController::class, 'closedTodayByUser']);
        Route::get('/users/{empCode}/closed-week', [UcTagSummaryController::class, 'closedThisWeekByUser']);
        Route::get('/users/{empCode}/closed-month', [UcTagSummaryController::class, 'closedMonthByUser']);
        Route::get('/users/{empCode}/in-progress', [UcTagSummaryController::class, 'inProgressByUser']);
        Route::get('/users/{empCode}/closed-range', [UcTagSummaryController::class, 'closedRange']);

        Route::get('/users/{empCode}/forwarded-today', [UcTagSummaryController::class, 'forwardedTodayByUser']);
        Route::get('/users/{empCode}/forwarded-range', [UcTagSummaryController::class, 'forwardedRangeByUser']);

        //หน้า Reports (Statistics)
        Route::get('/employee/{empCode}/cases', [StatisticsController::class, 'getAllCasesByUser']);
        Route::get('/tag/{tagName}/cases', [StatisticsController::class, 'getAllCasesByTag']);

        Route::get('/options/platforms',   [StatisticsController::class, 'optionsPlatforms']);
        Route::get('/options/departments', [StatisticsController::class, 'optionsDepartments']);
        Route::get('/options/employees',   [StatisticsController::class, 'optionsEmployees']);

        Route::get('/tag-workload', [StatisticsController::class, 'tagWorkloadSummary']);
        Route::get('/employee',     [StatisticsController::class, 'employeeWorkloadSummary']);
        Route::get('/employee-range',     [StatisticsController::class, 'employeeWorkloadSummaryRange']);
        Route::get('/tag-workload-range', [StatisticsController::class, 'tagWorkloadSummaryRange']);
        Route::get('/options/rooms', [StatisticsController::class, 'optionsRooms']);
        Route::get('/tag/{tagName}/descriptions', [StatisticsController::class, 'getDescriptionsByTag']);

        // เปรียบเทียบ/สรุปช่วงวัน
        Route::get('/closure-stats',         [ClosureCompareController::class, 'closureStats']);
        Route::get('/closure-range-stats',   [ClosureCompareController::class, 'closureRangeStats']);

        // รายการเคสปิด (in-time / after-hour) + กราฟนอกเวลาช่วงวัน
        Route::get('/after-hour-closure-range-stats', [ClosedCasesController::class, 'afterHourClosureRangeStats']);
        Route::get('/after-hour-closed-cases',        [ClosedCasesController::class, 'afterHourClosedCases']);
        Route::get('/in-hour-closed-cases',           [ClosedCasesController::class, 'inHourClosedCases']);

        // กำลังดำเนินการ
        Route::get('/in-progress-business-hours', [InProgressController::class, 'inProgressByBusinessHours']);
        Route::get('/in-progress-cases',          [InProgressController::class, 'inProgressCases']);

        // Pending
        Route::get('/pending-today',  [PendingController::class, 'pendingToday']);
        Route::get('/pending-cases',  [PendingController::class, 'pendingCases']);

        // Export เดิมคงไว้
        Route::get('/export/closure-range.xlsx',        [ExportExcelController::class, 'exportClosureRangeExcel']);
        Route::get('/export/after-hour-range.xlsx',     [ExportExcelController::class, 'exportAfterHourRangeExcel']);
        Route::get('/export/detailed-cases.xlsx',       [ExportExcelController::class, 'exportDetailedCasesRangeExcel']);
        Route::get('/export/detailed-cases-intime.xlsx', [ExportExcelController::class, 'exportDetailedCasesRangeInTimeExcel']);
    });
});
