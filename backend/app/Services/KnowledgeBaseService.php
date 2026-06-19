<?php

namespace App\Services;

use App\Models\KnowledgeBaseEntry;
use App\Models\TagMenu;
use Illuminate\Support\Facades\Log;

class KnowledgeBaseService
{
    public function stats(): array
    {
        $data['status'] = false;
        try {
            $counts = KnowledgeBaseEntry::where('is_excluded', false)
                ->selectRaw('admin_status, COUNT(*) as count')
                ->groupBy('admin_status')
                ->pluck('count', 'admin_status')
                ->toArray();
            $excluded = KnowledgeBaseEntry::where('is_excluded', true)->count();
            $data['status'] = true;
            $data['stats']  = [
                'pending'  => (int) ($counts['pending']  ?? 0),
                'approved' => (int) ($counts['approved'] ?? 0),
                'rejected' => (int) ($counts['rejected'] ?? 0),
                'excluded' => (int) $excluded,
                'total'    => array_sum(array_map('intval', $counts)),
            ];
        } catch (\Exception $e) {
            Log::error('KnowledgeBaseService@stats: ' . $e->getMessage());
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function list(string $status = null, string $tagName = null, bool $showExcluded = false): array
    {
        $data['status'] = false;
        try {
            $query = KnowledgeBaseEntry::orderBy('created_at', 'DESC');
            $query->where('is_excluded', $showExcluded);
            if ($status && in_array($status, ['pending', 'approved', 'rejected'])) {
                $query->where('admin_status', $status);
            }
            if ($tagName) {
                $query->where('tag_name', $tagName);
            }
            $data['list']   = $query->get();
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

    public function exclude(int $id): array
    {
        $data['status'] = false;
        try {
            $entry = KnowledgeBaseEntry::findOrFail($id);
            $entry->is_excluded = true;
            $entry->save();
            $data['status']  = true;
            $data['message'] = 'ตัดออกจาก Knowledge Base สำเร็จ';
        } catch (\Exception $e) {
            Log::error('KnowledgeBaseService@exclude: ' . $e->getMessage());
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function restore(int $id): array
    {
        $data['status'] = false;
        try {
            $entry = KnowledgeBaseEntry::findOrFail($id);
            $entry->is_excluded = false;
            $entry->save();
            $data['status']  = true;
            $data['message'] = 'คืนค่าเข้า Knowledge Base สำเร็จ';
        } catch (\Exception $e) {
            Log::error('KnowledgeBaseService@restore: ' . $e->getMessage());
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function show(int $id): array
    {
        $data['status'] = false;
        try {
            $entry = KnowledgeBaseEntry::findOrFail($id);
            $data['entry'] = $entry;
            $data['status'] = true;
        } catch (\Exception $e) {
            Log::error('KnowledgeBaseService@show: ' . $e->getMessage());
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function approve(int $id, int $adminId, string $adminName): array
    {
        $data['status'] = false;
        try {
            $entry = KnowledgeBaseEntry::findOrFail($id);
            $entry->admin_status    = 'approved';
            $entry->admin_answer    = null;
            $entry->admin_note      = null;
            $entry->approved_by     = $adminId;
            $entry->approved_by_name = $adminName;
            $entry->approved_at     = now();
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
            $entry = KnowledgeBaseEntry::findOrFail($id);
            $entry->admin_status    = 'rejected';
            $entry->admin_answer    = $adminAnswer;
            $entry->admin_note      = $note;
            $entry->approved_by     = $adminId;
            $entry->approved_by_name = $adminName;
            $entry->approved_at     = now();
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

    public function updateAi(int $id, string $topic, string $answer): array
    {
        $data['status'] = false;
        try {
            $entry = KnowledgeBaseEntry::findOrFail($id);
            $entry->ai_topic  = trim($topic);
            $entry->ai_answer = trim($answer);
            $entry->save();

            $data['status']  = true;
            $data['message'] = 'บันทึกข้อมูล AI สำเร็จ';
            $data['entry']   = $entry;
        } catch (\Exception $e) {
            Log::error('KnowledgeBaseService@updateAi: ' . $e->getMessage());
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function resetPending(int $id): array
    {
        $data['status'] = false;
        try {
            $entry = KnowledgeBaseEntry::findOrFail($id);
            $entry->admin_status    = 'pending';
            $entry->admin_answer    = null;
            $entry->admin_note      = null;
            $entry->approved_by     = null;
            $entry->approved_by_name = null;
            $entry->approved_at     = null;
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
}
