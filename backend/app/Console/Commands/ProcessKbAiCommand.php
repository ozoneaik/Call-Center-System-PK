<?php

namespace App\Console\Commands;

use App\Jobs\ProcessKbAiJob;
use App\Models\KnowledgeBaseEntry;
use Illuminate\Console\Command;

class ProcessKbAiCommand extends Command
{
    protected $signature = 'kb:process-ai
                            {--limit=  : จำกัดจำนวนรายการ}
                            {--force   : ประมวลผลซ้ำแม้มี ai_topic แล้ว}
                            {--dry-run : ดูตัวเลขเฉยๆ ไม่ dispatch จริง}';

    protected $description = 'Dispatch AI jobs เพื่อสรุปหัวข้อและคำตอบใน Knowledge Base';

    public function handle(): int
    {
        $isDry = $this->option('dry-run');
        $force = $this->option('force');
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;

        $query = KnowledgeBaseEntry::orderBy('created_at', 'desc');
        if (!$force) {
            $query->whereNull('ai_topic');
        }

        $totalInDb = $query->count();
        $total     = $limit ? min($totalInDb, $limit) : $totalInDb;

        if ($total === 0) {
            $this->info('ไม่มี KB entries ที่ต้องประมวลผล AI');
            return self::SUCCESS;
        }

        $this->info("พบ KB entries ที่ยังไม่มี AI: {$totalInDb} รายการ" . ($limit ? " (จำกัด {$limit} รายการ)" : ''));

        if ($isDry) {
            $this->warn('--dry-run mode: ไม่ได้ dispatch จริง');
            return self::SUCCESS;
        }

        if (!$this->confirm("ต้องการ dispatch {$total} AI jobs เข้า queue 'ai' ใช่ไหม?")) {
            $this->line('ยกเลิก');
            return self::SUCCESS;
        }

        $bar        = $this->output->createProgressBar($total);
        $bar->start();
        $dispatched = 0;

        $query->chunk(50, function ($entries) use ($bar, &$dispatched, $limit) {
            foreach ($entries as $entry) {
                if ($limit && $dispatched >= $limit) return false;
                ProcessKbAiJob::dispatch($entry->id)->onQueue('ai');
                $dispatched++;
                $bar->advance();
            }
            if ($limit && $dispatched >= $limit) return false;
        });

        $bar->finish();
        $this->newLine();
        $this->info("Dispatch สำเร็จ {$dispatched} AI jobs");
        $this->line("รัน: php artisan queue:work --queue=ai --timeout=180");

        return self::SUCCESS;
    }
}
