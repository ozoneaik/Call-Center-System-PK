<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Artisan::command('author', function () {
    $this->comment('phuwadech panichayasopa');
});

Schedule::command('shopee:fetch-messages')->everyTenSeconds()->before(function () {
    Log::info('Schedule is running: shopee:fetch-messages');
});

Schedule::command('shopee:refresh-token')->everyThreeHours()->before(function () {
    Log::info('Schedule is running: shopee:refresh-token');
});
