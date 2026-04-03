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

// แนะนำให้ดึงย้อนหลังแค่ 1-3 วัน เพื่อไม่ให้ติด Limit API ของ Shopee และทำงานเร็วขึ้น
// ดึงทุกๆ 1 ชั่วโมง (หรือเปลี่ยนเป็น everyFifteenMinutes() ก็ได้)
Schedule::command('sync:shopee-orders --days=1')->hourly();

// ถ้าอยากดึงชุดใหญ่ 90 วัน ให้ตั้งให้รันแค่วันละครั้งตอนตี 2 
Schedule::command('sync:shopee-orders --days=90')->dailyAt('02:00');

// ดึงออเดอร์ Lazada ย้อนหลัง 1 วัน ทุกๆ ชั่วโมง (แต่ให้รันตอนนาทีที่ 30 เพื่อไม่ให้แย่งโหลดเซิร์ฟเวอร์กับ Shopee)
Schedule::command('sync:lazada-orders --days=1')->hourlyAt(30);

// ดึงออเดอร์ Lazada ย้อนหลัง 90 วัน วันละ 1 ครั้ง ตอนตี 3
Schedule::command('sync:lazada-orders --days=90')->dailyAt('03:00');