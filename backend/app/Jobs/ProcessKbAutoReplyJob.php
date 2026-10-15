<?php

namespace App\Jobs;

use App\Services\KbAutoReplyService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * พิจารณาตอบอัตโนมัติจาก KB ให้ข้อความลูกค้า 1 ข้อความ — ทำเบื้องหลังเพราะต้องรอ chat-oc-summary (สูงสุด ~60 วิ)
 * ไม่ให้ webhook ต้องรอ
 */
class ProcessKbAutoReplyJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;
    public int $timeout = 120;

    // คิวแยกเฉพาะงานนี้ — ต้องรัน worker: php artisan queue:work --queue=auto-reply
    // (แยกจากคิว default เพื่อให้ตอบได้ทันที ไม่ต้องรอต่อท้ายงานอื่นที่ค้างอยู่)
    public const QUEUE = 'auto-reply';

    public function __construct(
        protected int $chatHistoryId
    ) {
        $this->onQueue(self::QUEUE);
    }

    public function handle(KbAutoReplyService $service): void
    {
        $service->handle($this->chatHistoryId);
    }
}
