<?php

namespace App\Console\Commands;

use App\Jobs\ProcessKnowledgeBaseJob;
use App\Models\ActiveConversations;
use App\Models\KnowledgeBaseEntry;
use Illuminate\Console\Command;

class ImportHistoricalChatsToKb extends Command
{
    protected $signature = 'kb:import-history
                            {--from= : วันที่เริ่มต้น (Y-m-d) เช่น 2024-01-01}
                            {--to=   : วันที่สิ้นสุด (Y-m-d) เช่น 2024-12-31}
                            {--limit=: จำกัดจำนวนรายการ}
                            {--dry-run : ดูตัวเลขอย่างเดียว ไม่บันทึกจริง}';

    protected $description = 'Import ประวัติแชทที่จบแล้วเข้า Knowledge Base';

    public function handle(): int
    {
        $isDry  = $this->option('dry-run');
        $from   = $this->option('from');
        $to     = $this->option('to');
        $limit  = $this->option('limit') ? (int) $this->option('limit') : null;

        // ดึง active_conversation_id ที่มีใน KB แล้ว เพื่อ skip
        $existingIds = KnowledgeBaseEntry::whereNotNull('active_conversation_id')
            ->pluck('active_conversation_id')
            ->toArray();

        // query การสนทนาที่จบแล้ว (endTime ไม่ null)
        $query = ActiveConversations::whereNotNull('endTime')
            ->whereNotIn('id', $existingIds)
            ->orderBy('endTime', 'desc');

        if ($from) {
            $query->where('endTime', '>=', $from . ' 00:00:00');
        }
        if ($to) {
            $query->where('endTime', '<=', $to . ' 23:59:59');
        }
        $totalInDb = $query->count();
        $total     = $limit ? min($totalInDb, $limit) : $totalInDb;

        if ($total === 0) {
            $this->info('ไม่มีการสนทนาที่ต้อง import');
            return self::SUCCESS;
        }

        $this->info("พบการสนทนาที่จบแล้วและยังไม่อยู่ใน KB: {$totalInDb} รายการ" . ($limit ? " (จำกัด {$limit} รายการ)" : ''));

        if ($isDry) {
            $this->warn('--dry-run mode: ไม่ได้บันทึกจริง');
            return self::SUCCESS;
        }

        if (!$this->confirm("ต้องการ dispatch {$total} jobs เข้า queue ใช่ไหม?")) {
            $this->line('ยกเลิก');
            return self::SUCCESS;
        }

        $bar  = $this->output->createProgressBar($total);
        $bar->start();

        $dispatched = 0;
        // ลบ limit() ออกจาก query เพราะ chunk() ไม่รองรับ — ใช้นับใน callback แทน
        $query->chunk(100, function ($conversations) use ($bar, &$dispatched, $limit) {
            foreach ($conversations as $ac) {
                if ($limit && $dispatched >= $limit) {
                    return false; // หยุด chunk
                }
                ProcessKnowledgeBaseJob::dispatch($ac->id);
                $dispatched++;
                $bar->advance();
            }
            if ($limit && $dispatched >= $limit) {
                return false; // หยุด chunk
            }
        });

        $bar->finish();
        $this->newLine();
        $this->info("Dispatch สำเร็จ {$dispatched} jobs — รัน 'php artisan queue:work' เพื่อประมวลผล");

        return self::SUCCESS;
    }
}
