<?php

namespace App\Jobs;

use App\Models\KnowledgeBaseEntry;
use App\Services\OllamaService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessKbAiJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 180;
    public int $tries   = 2;

    public function __construct(
        protected int $entryId
    ) {}

    public function handle(OllamaService $ollama): void
    {
        try {
            $entry = KnowledgeBaseEntry::find($this->entryId);
            if (!$entry) {
                Log::warning("ProcessKbAiJob: ไม่พบ KB entry id={$this->entryId}");
                return;
            }

            if ($entry->ai_topic !== null) {
                Log::info("ProcessKbAiJob: entryId={$this->entryId} มี ai_topic แล้ว ข้าม");
                return;
            }

            $result = $ollama->analyzeChat($entry->chat_data ?? []);
            if (!$result) {
                Log::warning("ProcessKbAiJob: Ollama ไม่ส่งผลกลับ entryId={$this->entryId}");
                return;
            }

            $entry->ai_topic  = $result['topic'];
            $entry->ai_answer = $result['answer'];
            $entry->save();

            Log::info("ProcessKbAiJob: อัปเดต AI สำเร็จ entryId={$this->entryId} topic={$result['topic']}");
        } catch (\Throwable $e) {
            Log::error("ProcessKbAiJob error entryId={$this->entryId}: " . $e->getMessage());
            throw $e;
        }
    }
}
