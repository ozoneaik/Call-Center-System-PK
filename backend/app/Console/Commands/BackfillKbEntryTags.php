<?php

namespace App\Console\Commands;

use App\Models\AiKbEntry;
use Illuminate\Console\Command;

class BackfillKbEntryTags extends Command
{
    protected $signature = 'kb:backfill-tags {--dry-run : แสดงผลเฉยๆ ไม่บันทึกลงฐานข้อมูล}';

    protected $description = 'เติม tag_name ให้ ai_kb_entries ที่ยังว่าง โดยใช้ Tag ที่ปิดเคสของ active_conversation_id';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $conversationIds = AiKbEntry::whereNull('tag_name')
            ->whereNotNull('active_conversation_id')
            ->distinct()
            ->pluck('active_conversation_id');

        $filled  = 0;
        $skipped = 0;
        foreach ($conversationIds as $acId) {
            $tagName = AiKbEntry::resolveTagName((int) $acId);
            if (!$tagName) {
                $skipped++;
                continue;
            }

            $filled += $dryRun
                ? AiKbEntry::where('active_conversation_id', $acId)->whereNull('tag_name')->count()
                : AiKbEntry::fillTagForConversation((int) $acId);
        }

        $this->info(($dryRun ? '[dry-run] ' : '') . "เติม Tag ได้ {$filled} รายการ / เคสที่ยังไม่มี Tag {$skipped} เคส");

        return self::SUCCESS;
    }
}
