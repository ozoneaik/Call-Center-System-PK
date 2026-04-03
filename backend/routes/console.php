<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Artisan::command('author', function (){
    $this->comment('phuwadech panichayasopa');
});

//  2. เพิ่มการตั้งเวลา (Task Scheduling) สำหรับ Token ตรงนี้เลยครับ

// Shopee: รันทุกๆ 15 นาที (เพราะ Token หมดอายุไวมาก)
Schedule::command('shopee:refresh-tokens')->everyFifteenMinutes();

// Lazada: รันทุกวัน เวลาตี 2 (เพราะ Token มีอายุ 30 วัน เช็ควันละรอบก็พอ)
Schedule::command('lazada:refresh-tokens')->dailyAt('02:00');