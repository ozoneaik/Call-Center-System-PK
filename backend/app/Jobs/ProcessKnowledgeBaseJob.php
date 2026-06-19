<?php

namespace App\Jobs;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\KnowledgeBaseEntry;
use App\Models\PlatformAccessTokens;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessKnowledgeBaseJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected int $activeConversationId
    ) {}

    public function handle(): void
    {
        try {
            $ac = ActiveConversations::find($this->activeConversationId);
            if (!$ac) {
                Log::warning("ProcessKnowledgeBaseJob: ไม่พบ ActiveConversation id={$this->activeConversationId}");
                return;
            }

            $histories = ChatHistory::where('conversationRef', $this->activeConversationId)
                ->orderBy('created_at', 'asc')
                ->get(['custId', 'content', 'contentType', 'sender', 'created_at']);

            if ($histories->isEmpty()) {
                Log::info("ProcessKnowledgeBaseJob: ไม่มีประวัติแชท activeId={$this->activeConversationId} ข้าม");
                return;
            }

            // --- Quality filter ---
            $roles = $histories->map(function ($h) {
                $sender = is_string($h->sender) ? json_decode($h->sender, true) : $h->sender;
                $empCode = $sender['empCode'] ?? null;
                if ($empCode === null)    return 'customer';
                if ($empCode === 'BOT')   return 'bot';
                return 'agent';
            });

            // น้อยกว่า 3 ข้อความ → ไม่มีสาระพอ
            if ($histories->count() < 3) {
                Log::info("ProcessKnowledgeBaseJob: activeId={$this->activeConversationId} มีแค่ {$histories->count()} msg ข้าม");
                return;
            }
            // ไม่มีลูกค้าพูดเลย
            if (!$roles->contains('customer')) {
                Log::info("ProcessKnowledgeBaseJob: activeId={$this->activeConversationId} ไม่มีข้อความลูกค้า ข้าม");
                return;
            }
            // ไม่มี agent ตอบเลย (BOT + customer ล้วน)
            if (!$roles->contains('agent')) {
                Log::info("ProcessKnowledgeBaseJob: activeId={$this->activeConversationId} ไม่มี agent ตอบ ข้าม");
                return;
            }

            // ดึง platform จาก customer
            $platform = null;
            $customer = Customers::where('custId', $ac->custId)->first();
            if ($customer) {
                $token = PlatformAccessTokens::find($customer->platformRef);
                $platform = $token?->platform;
            }

            // จัดรูปแบบ chat_data
            $chatData = $histories->map(function ($h) {
                $sender = is_string($h->sender) ? json_decode($h->sender, true) : $h->sender;

                $empCode = $sender['empCode'] ?? null;
                if ($empCode === null) {
                    $role = 'customer';
                    $senderName = $sender['custName'] ?? 'unknown';
                    $custId = $sender['custId'] ?? null;
                } elseif ($empCode === 'BOT') {
                    $role = 'bot';
                    $senderName = 'BOT';
                    $custId = null;
                } else {
                    $role = 'agent';
                    $senderName = $sender['real_name'] ?? $sender['name'] ?? $empCode;
                    $custId = null;
                }

                $msg = [
                    'role'        => $role,
                    'sender_name' => $senderName,
                    'contentType' => $h->contentType,
                    'content'     => $h->content,
                    'sent_at'     => $h->created_at?->toIso8601String(),
                ];
                if ($custId !== null) {
                    $msg['cust_id'] = $custId;
                }
                return $msg;
            })->values()->toArray();

            // ป้องกัน duplicate — ถ้ามีอยู่แล้วให้ข้าม
            $exists = KnowledgeBaseEntry::where('active_conversation_id', $this->activeConversationId)->exists();
            if ($exists) {
                Log::info("ProcessKnowledgeBaseJob: activeId={$this->activeConversationId} มีใน KB แล้ว ข้าม");
                return;
            }

            $entry = KnowledgeBaseEntry::create([
                'active_conversation_id' => $this->activeConversationId,
                'cust_id'                => $ac->custId,
                'chat_data'              => $chatData,
                'ai_topic'               => null,
                'ai_answer'              => null,
                'admin_status'           => 'pending',
                'platform'               => $platform,
                'room_id'                => $ac->roomId,
            ]);

            Log::info("ProcessKnowledgeBaseJob: บันทึก KB สำเร็จ activeId={$this->activeConversationId}");

            ProcessKbAiJob::dispatch($entry->id)->onQueue('ai');
        } catch (\Throwable $e) {
            Log::error("ProcessKnowledgeBaseJob error: " . $e->getMessage());
            throw $e;
        }
    }
}
