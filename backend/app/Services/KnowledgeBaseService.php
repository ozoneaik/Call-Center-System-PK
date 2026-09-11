<?php

namespace App\Services;

use App\Models\AiKbEntry;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\TagMenu;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class KnowledgeBaseService
{
    /**
     * คอลัมน์ที่ใช้แสดงผลหน้าแอดมิน — ไม่ดึง embedding/embedding_src/embedding_at (vector สำหรับค้นหาความหมาย)
     * เพราะเป็น field ขนาดใหญ่ที่ไม่ได้ใช้แสดงผล ดึงมาทุกแถวจะทำให้ payload บวมโดยเปล่าประโยชน์
     */
    private const DISPLAY_COLUMNS = [
        'id', 'question', 'answer', 'answer_attachments', 'alt', 'note', 'source', 'tag_name',
        'cust_id', 'active_conversation_id', 'message_ref', 'created_by', 'created_by_name',
        'is_active', 'admin_status', 'admin_answer', 'admin_note',
        'approved_by', 'approved_by_name', 'approved_at',
        'created_at', 'updated_at',
    ];

    public function stats(): array
    {
        $data['status'] = false;
        try {
            // นับตาม admin_status เฉพาะรายการที่ยังเปิดใช้งานอยู่ (ปิดใช้งานแล้วนับแยกต่างหาก เหมือน is_excluded เดิม)
            $counts = AiKbEntry::where('is_active', true)
                ->selectRaw('admin_status, COUNT(*) as count')
                ->groupBy('admin_status')
                ->pluck('count', 'admin_status')
                ->toArray();
            $inactive = AiKbEntry::where('is_active', false)->count();
            $data['status'] = true;
            $data['stats']  = [
                'pending'  => (int) ($counts['pending']  ?? 0),
                'approved' => (int) ($counts['approved'] ?? 0),
                'rejected' => (int) ($counts['rejected'] ?? 0),
                'inactive' => (int) $inactive,
                'total'    => array_sum(array_map('intval', $counts)),
            ];
        } catch (\Exception $e) {
            Log::error('KnowledgeBaseService@stats: ' . $e->getMessage());
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function list(
        ?string $adminStatus = null,
        ?string $tagName = null,
        bool $showInactive = false,
        ?string $search = null,
        int $page = 1,
        int $perPage = 20
    ): array {
        $data['status'] = false;
        try {
            $perPage = max(1, min($perPage, 100));
            $page    = max(1, $page);

            $query = AiKbEntry::query()
                ->select(self::DISPLAY_COLUMNS)
                ->where('is_active', !$showInactive)
                ->orderBy('created_at', 'DESC');

            if ($adminStatus && in_array($adminStatus, ['pending', 'approved', 'rejected'])) {
                $query->where('admin_status', $adminStatus);
            }
            if ($tagName) {
                $query->where('tag_name', $tagName);
            }
            if ($search) {
                $term = '%' . $search . '%';
                $query->where(function ($q) use ($term) {
                    $q->where('question', 'ILIKE', $term)
                        ->orWhere('answer', 'ILIKE', $term)
                        ->orWhere('note', 'ILIKE', $term)
                        ->orWhere('tag_name', 'ILIKE', $term)
                        ->orWhere('cust_id', 'ILIKE', $term)
                        ->orWhere('created_by_name', 'ILIKE', $term);
                });
            }

            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            $data['list']   = $paginator->items();
            $data['meta']   = [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ];
            $data['status'] = true;
        } catch (\Exception $e) {
            Log::error('KnowledgeBaseService@list: ' . $e->getMessage());
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function tags(): array
    {
        $data['status'] = false;
        try {
            $data['tags']   = TagMenu::orderBy('tagName')->pluck('tagName');
            $data['status'] = true;
        } catch (\Exception $e) {
            Log::error('KnowledgeBaseService@tags: ' . $e->getMessage());
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function show(int $id): array
    {
        $data['status'] = false;
        try {
            $entry = AiKbEntry::select(self::DISPLAY_COLUMNS)->findOrFail($id);
            $data['entry']  = $entry;
            $data['status'] = true;
        } catch (\Exception $e) {
            Log::error('KnowledgeBaseService@show: ' . $e->getMessage());
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    /**
     * ดึงประวัติแชททั้งหมดของลูกค้าคนนี้ (custId) + ข้อมูลลูกค้า เพื่อจำลองหน้าแชทจริงแบบ read-only
     * — ใช้ query เดียวกับหน้าแชทจริง (DisplayService::selectMessage: where custId, 200 ข้อความล่าสุด)
     * ไม่จำกัดเฉพาะ session เดียว (active_conversation_id) เพราะลูกค้าอาจมีหลาย session ต่อกันเป็น
     * บทสนทนาเดียวในสายตาแอดมิน (เช่น เริ่มคุยกับ BOT ก่อนแล้วพนักงานรับเรื่องต่อ คนละ conversationRef)
     *
     * แต่ละข้อความจะมี in_source_session บอกว่าอยู่ใน session เดียวกับตอนที่เพิ่มเข้า KB หรือไม่
     * (เทียบ conversationRef กับ active_conversation_id ของ entry) ให้ frontend ไฮไลต์ "ช่วง" ที่ใช้สร้าง
     * KB นี้ในบทสนทนาทั้งหมดได้ — ไม่ใช่แค่ข้อความเดียว (message_ref คือจุดที่แม่นกว่านั้นอีกชั้น ถ้ามี)
     */
    public function conversation(int $id): array
    {
        $data['status'] = false;
        try {
            $entry = AiKbEntry::select(self::DISPLAY_COLUMNS)->findOrFail($id);

            $messages = collect();
            if ($entry->cust_id) {
                $chatHistory = ChatHistory::where('custId', $entry->cust_id)
                    ->orderBy('id', 'desc')
                    ->limit(200)
                    ->get(['id', 'custId', 'content', 'contentType', 'sender', 'conversationRef', 'created_at'])
                    ->sortBy('id')
                    ->values();

                // รวบรวม empCode เพื่อดึง real_name จากตาราง users (เหมือน HistoryController@ChatHistoryDetail)
                $empCodes = [];
                foreach ($chatHistory as $chat) {
                    $sender = is_string($chat->sender) ? json_decode($chat->sender, true) : $chat->sender;
                    if (is_array($sender) && !empty($sender['empCode'])) {
                        $empCodes[] = $sender['empCode'];
                    }
                }
                $users = !empty($empCodes)
                    ? User::whereIn('empCode', array_unique($empCodes))->get(['empCode', 'real_name', 'name'])->keyBy('empCode')
                    : collect();

                $messages = $chatHistory->map(function ($chat) use ($users, $entry) {
                    $sender = is_string($chat->sender) ? json_decode($chat->sender, true) : $chat->sender;
                    $sender = is_array($sender) ? $sender : [];
                    $empCode = $sender['empCode'] ?? null;
                    if ($empCode && ($user = $users->get($empCode))) {
                        $sender['real_name'] = $user->real_name;
                        $sender['name']      = $user->name;
                    }
                    $role = $empCode === null ? 'customer' : ($empCode === 'BOT' ? 'bot' : 'agent');

                    return [
                        'id'                => $chat->id,
                        'content'           => $chat->content,
                        'contentType'       => $chat->contentType,
                        'sender'            => $sender,
                        'role'              => $role,
                        'created_at'        => $chat->created_at,
                        'in_source_session' => $entry->active_conversation_id !== null
                            && (int) $chat->conversationRef === (int) $entry->active_conversation_id,
                    ];
                })->values();
            }

            $customer = $entry->cust_id
                ? Customers::where('custId', $entry->cust_id)->first(['custId', 'custName', 'avatar', 'description'])
                : null;

            $data['status']   = true;
            $data['entry']    = $entry;
            $data['customer'] = $customer;
            $data['messages'] = $messages;
        } catch (\Exception $e) {
            Log::error('KnowledgeBaseService@conversation: ' . $e->getMessage());
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function update(int $id, string $question, string $answer, ?string $note, ?string $tagName): array
    {
        $data['status'] = false;
        try {
            $entry = AiKbEntry::findOrFail($id);
            $entry->question = trim($question);
            $entry->answer   = trim($answer);
            $entry->note     = $note !== null && trim($note) !== '' ? trim($note) : null;
            $entry->tag_name = $tagName;
            $entry->save();

            $data['status']  = true;
            $data['message'] = 'บันทึกข้อมูลสำเร็จ';
            $data['entry']   = $entry;
        } catch (\Exception $e) {
            Log::error('KnowledgeBaseService@update: ' . $e->getMessage());
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function approve(int $id, int $adminId, string $adminName): array
    {
        $data['status'] = false;
        try {
            $entry = AiKbEntry::findOrFail($id);
            $entry->admin_status     = 'approved';
            $entry->admin_answer     = null;
            $entry->admin_note       = null;
            $entry->approved_by      = $adminId;
            $entry->approved_by_name = $adminName;
            $entry->approved_at      = now();
            $entry->save();

            $data['status']  = true;
            $data['message'] = 'อนุมัติข้อมูลสำเร็จ';
            $data['entry']   = $entry;
        } catch (\Exception $e) {
            Log::error('KnowledgeBaseService@approve: ' . $e->getMessage());
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function reject(int $id, int $adminId, string $adminName, string $adminAnswer, ?string $note): array
    {
        $data['status'] = false;
        try {
            $entry = AiKbEntry::findOrFail($id);
            $entry->admin_status     = 'rejected';
            $entry->admin_answer     = $adminAnswer;
            $entry->admin_note       = $note;
            $entry->approved_by      = $adminId;
            $entry->approved_by_name = $adminName;
            $entry->approved_at      = now();
            $entry->save();

            $data['status']  = true;
            $data['message'] = 'บันทึกคำตอบที่แก้ไขสำเร็จ';
            $data['entry']   = $entry;
        } catch (\Exception $e) {
            Log::error('KnowledgeBaseService@reject: ' . $e->getMessage());
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    /**
     * ปรับแก้คำตอบพร้อมอนุมัติในขั้นตอนเดียว — ต่างจาก reject() ตรงที่ admin_status = 'approved'
     * (ไม่ใช่ 'rejected') ใช้ตอนแอดมินแก้เนื้อหาเล็กน้อยแต่มั่นใจว่าถูกต้อง ไม่ต้องการให้ค้างสถานะ "ปรับแก้แล้ว"
     */
    public function approveEdited(int $id, int $adminId, string $adminName, string $adminAnswer, ?string $note): array
    {
        $data['status'] = false;
        try {
            $entry = AiKbEntry::findOrFail($id);
            $entry->admin_status     = 'approved';
            $entry->admin_answer     = trim($adminAnswer);
            $entry->admin_note       = $note;
            $entry->approved_by      = $adminId;
            $entry->approved_by_name = $adminName;
            $entry->approved_at      = now();
            $entry->save();

            $data['status']  = true;
            $data['message'] = 'บันทึกคำตอบที่แก้ไขและอนุมัติสำเร็จ';
            $data['entry']   = $entry;
        } catch (\Exception $e) {
            Log::error('KnowledgeBaseService@approveEdited: ' . $e->getMessage());
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function resetPending(int $id): array
    {
        $data['status'] = false;
        try {
            $entry = AiKbEntry::findOrFail($id);
            $entry->admin_status     = 'pending';
            $entry->admin_answer     = null;
            $entry->admin_note       = null;
            $entry->approved_by      = null;
            $entry->approved_by_name = null;
            $entry->approved_at      = null;
            $entry->save();

            $data['status']  = true;
            $data['message'] = 'รีเซ็ตสถานะสำเร็จ';
            $data['entry']   = $entry;
        } catch (\Exception $e) {
            Log::error('KnowledgeBaseService@resetPending: ' . $e->getMessage());
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function toggleActive(int $id): array
    {
        $data['status'] = false;
        try {
            $entry = AiKbEntry::findOrFail($id);
            $entry->is_active = !$entry->is_active;
            $entry->save();

            $data['status']  = true;
            $data['message'] = $entry->is_active ? 'เปิดใช้งานสำเร็จ' : 'ปิดใช้งานสำเร็จ';
            $data['entry']   = $entry;
        } catch (\Exception $e) {
            Log::error('KnowledgeBaseService@toggleActive: ' . $e->getMessage());
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function destroy(int $id): array
    {
        $data['status'] = false;
        try {
            $entry = AiKbEntry::findOrFail($id);
            $entry->delete();

            $data['status']  = true;
            $data['message'] = 'ลบข้อมูลสำเร็จ';
        } catch (\Exception $e) {
            Log::error('KnowledgeBaseService@destroy: ' . $e->getMessage());
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }
}
