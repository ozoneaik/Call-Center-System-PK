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

    public function __construct(
        protected int $chatHistoryId
    ) {}

    public function handle(KbAutoReplyService $service): void
    {
        $service->handle($this->chatHistoryId);
    }
}
