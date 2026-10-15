<?php

namespace App\Http\Controllers;

use App\Models\AiKbEntry;
use App\Models\ChatRooms;
use App\Models\KbAutoReplyLog;
use App\Models\KbAutoReplySetting;
use App\Services\KbAutoReplyService;
use App\Services\KnowledgeBaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class KnowledgeBaseController extends Controller
{
    protected KnowledgeBaseService $kbService;

    public function __construct(KnowledgeBaseService $kbService)
    {
        $this->kbService = $kbService;
    }

    public function stats(): JsonResponse
    {
        $result = $this->kbService->stats();
        if ($result['status']) {
            return response()->json($result['stats']);
        }
        return response()->json(['message' => 'เกิดข้อผิดพลาด'], 400);
    }

    public function list(Request $request): JsonResponse
    {
        $result = $this->kbService->list(
            $request->query('status'),
            $request->query('tag_name'),
            $request->boolean('inactive', false),
            $request->query('search'),
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 20),
        );
        if ($result['status']) {
            return response()->json([
                'message' => 'success',
                'list'    => $result['list'],
                'meta'    => $result['meta'],
            ]);
        }
        return response()->json(['message' => 'เกิดข้อผิดพลาด', 'detail' => $result['message']], 400);
    }

    public function tags(): JsonResponse
    {
        $result = $this->kbService->tags();
        if ($result['status']) {
            return response()->json($result['tags']);
        }
        return response()->json([], 400);
    }

    public function show(int $id): JsonResponse
    {
        $result = $this->kbService->show($id);
        if ($result['status']) {
            return response()->json([
                'message' => 'success',
                'entry'   => $result['entry'],
            ]);
        }
        return response()->json(['message' => 'ไม่พบข้อมูล', 'detail' => $result['message']], 400);
    }

    public function conversation(int $id): JsonResponse
    {
        $result = $this->kbService->conversation($id);
        if ($result['status']) {
            return response()->json([
                'message'  => 'success',
                'entry'    => $result['entry'],
                'customer' => $result['customer'],
                'messages' => $result['messages'],
            ]);
        }
        return response()->json(['message' => 'ไม่พบข้อมูล', 'detail' => $result['message']], 400);
    }

    public function update(int $id, Request $request): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $request->validate([
                'question' => 'required|string',
                'answer'   => 'required|string',
                'note'     => 'nullable|string',
                'tag_name' => 'nullable|string',
            ]);
            $result = $this->kbService->update(
                $id,
                $request->input('question'),
                $request->input('answer'),
                $request->input('note'),
                $request->input('tag_name'),
            );
            if ($result['status']) {
                $status  = 200;
                $message = $result['message'];
            } else throw new \Exception($result['message']);
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail'  => $detail,
            ], $status);
        }
    }

    public function approve(int $id): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $admin  = Auth::user();
            $result = $this->kbService->approve($id, $admin->id, $admin->real_name ?? $admin->name);
            if ($result['status']) {
                $status  = 200;
                $message = $result['message'];
            } else throw new \Exception($result['message']);
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail'  => $detail,
            ], $status);
        }
    }

    public function reject(int $id, Request $request): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $request->validate(['admin_answer' => 'required|string']);
            $admin  = Auth::user();
            $result = $this->kbService->reject(
                $id,
                $admin->id,
                $admin->real_name ?? $admin->name,
                $request->input('admin_answer'),
                $request->input('admin_note')
            );
            if ($result['status']) {
                $status  = 200;
                $message = $result['message'];
            } else throw new \Exception($result['message']);
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail'  => $detail,
            ], $status);
        }
    }

    public function approveEdited(int $id, Request $request): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $request->validate(['admin_answer' => 'required|string']);
            $admin  = Auth::user();
            $result = $this->kbService->approveEdited(
                $id,
                $admin->id,
                $admin->real_name ?? $admin->name,
                $request->input('admin_answer'),
                $request->input('admin_note')
            );
            if ($result['status']) {
                $status  = 200;
                $message = $result['message'];
            } else throw new \Exception($result['message']);
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail'  => $detail,
            ], $status);
        }
    }

    public function resetPending(int $id): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $result = $this->kbService->resetPending($id);
            if ($result['status']) {
                $status  = 200;
                $message = $result['message'];
            } else throw new \Exception($result['message']);
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail'  => $detail,
            ], $status);
        }
    }

    public function toggleActive(int $id): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $result = $this->kbService->toggleActive($id);
            if ($result['status']) {
                $status  = 200;
                $message = $result['message'];
            } else throw new \Exception($result['message']);
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail'  => $detail,
            ], $status);
        }
    }

    // แท็บ "จัดการข้อความส่งอัตโนมัติ" — รายการที่อนุมัติแล้ว พร้อมสถานะ auto_reply
    public function autoReplyList(Request $request): JsonResponse
    {
        $result = $this->kbService->autoReplyList(
            $request->query('auto_reply'),
            $request->query('tag_name'),
            $request->query('search'),
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 20),
        );
        if ($result['status']) {
            return response()->json([
                'message' => 'success',
                'list'    => $result['list'],
                'meta'    => $result['meta'],
            ]);
        }
        return response()->json(['message' => 'เกิดข้อผิดพลาด', 'detail' => $result['message']], 400);
    }

    // เปิด/ปิด AI ตอบอัตโนมัติ (รับได้ทั้งรายการเดียวและหลายรายการ)
    public function setAutoReply(Request $request): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $validated = $request->validate([
                'ids'     => 'required|array|min:1|max:500',
                'ids.*'   => 'integer',
                'enabled' => 'required|boolean',
            ]);
            $admin  = Auth::user();
            $result = $this->kbService->setAutoReply(
                $validated['ids'],
                (bool) $validated['enabled'],
                $admin->id,
                $admin->real_name ?? $admin->name
            );
            if ($result['status']) {
                $status  = 200;
                $message = $result['message'];
            } else throw new \Exception($result['message']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $status = 422;
            $detail = $e->getMessage();
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail'  => $detail,
                'updated' => $result['updated'] ?? 0,
                'skipped' => $result['skipped'] ?? [],
            ], $status);
        }
    }

    public function updateAlt(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate(['alt' => 'nullable|string|max:5000']);
        $result = $this->kbService->updateAlt($id, $validated['alt'] ?? null);
        if ($result['status']) {
            return response()->json(['message' => $result['message'], 'entry' => $result['entry']]);
        }
        return response()->json(['message' => 'เกิดข้อผิดพลาด', 'detail' => $result['message']], 400);
    }

    // ค่าตั้งระบบ AI ตอบอัตโนมัติ (โหมด + เกณฑ์คะแนน)
    public function autoReplySettings(): JsonResponse
    {
        return response()->json(KbAutoReplySetting::current()->toArray() + [
            // ตัวเลือกห้องสำหรับหน้าตั้งค่า (เฉพาะห้องที่เปิดใช้งาน)
            'rooms' => ChatRooms::where('is_active', 1)->orderBy('roomId')->get(['roomId', 'roomName']),
        ]);
    }

    public function updateAutoReplySettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mode'       => 'required|in:' . implode(',', KbAutoReplySetting::MODES),
            'min_score'  => 'required|numeric|min:0.1|max:1',
            'min_margin' => 'required|numeric|min:0|max:1',
            'room_ids'   => 'nullable|array',
            'room_ids.*' => 'string|exists:chat_rooms,roomId',
        ]);
        $validated['room_ids'] = array_values(array_unique($validated['room_ids'] ?? [])) ?: null;
        $admin   = Auth::user();
        $setting = KbAutoReplySetting::query()->orderBy('id')->first() ?? new KbAutoReplySetting();
        $setting->fill($validated + [
            'updated_by'      => $admin?->id,
            'updated_by_name' => $admin?->real_name ?? $admin?->name,
        ])->save();
        KbAutoReplySetting::forgetCache();

        return response()->json(['message' => 'บันทึกการตั้งค่าสำเร็จ', 'settings' => $setting->fresh()]);
    }

    // บันทึกการตัดสินใจของระบบ (ล่าสุดก่อน) — กรองตาม decision ได้
    public function autoReplyLogs(Request $request): JsonResponse
    {
        $perPage = max(1, min((int) $request->query('per_page', 20), 100));
        $query = KbAutoReplyLog::query()
            ->leftJoin('ai_kb_entries as e', 'e.id', '=', 'kb_auto_reply_logs.matched_entry_id')
            ->select('kb_auto_reply_logs.*', 'e.question as matched_question')
            ->orderByDesc('kb_auto_reply_logs.id');

        if ($decision = $request->query('decision')) {
            $query->where('kb_auto_reply_logs.decision', $decision);
        }
        $paginator = $query->paginate($perPage, ['*'], 'page', max(1, (int) $request->query('page', 1)));

        $summary = KbAutoReplyLog::query()
            ->where('created_at', '>=', now()->subDays(7))
            ->selectRaw('decision, COUNT(*) as count')
            ->groupBy('decision')
            ->pluck('count', 'decision');

        return response()->json([
            'list'    => $paginator->items(),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
            'summary_7d' => $summary,
        ]);
    }

    // ทดลองพิมพ์คำถาม ดูว่าระบบจะจับคู่กับรายการไหน คะแนนเท่าไร (ไม่เรียก AI ไม่ส่งข้อความ)
    public function autoReplyTest(Request $request): JsonResponse
    {
        $validated = $request->validate(['q' => 'required|string|max:1000']);
        $service   = app(KbAutoReplyService::class);
        $settings  = KbAutoReplySetting::current();

        $describe = function (?array $hit) {
            if (!$hit) return null;
            $entry = AiKbEntry::find($hit['id'], ['id', 'question', 'auto_reply']);
            return $hit + ['question' => $entry?->question, 'auto_reply' => (bool) $entry?->auto_reply];
        };

        [$top, $second] = $service->match(['message' => $validated['q']], true);
        [$topAll, $secondAll] = $service->match(['message' => $validated['q']], false);

        $wouldSend = $top
            && $top['score'] >= $settings->min_score
            && (!$second || ($top['score'] - $second['score']) >= $settings->min_margin);

        return response()->json([
            'would_send'   => $wouldSend,
            'auto_reply'   => ['top' => $describe($top), 'second' => $describe($second)],
            'all_approved' => ['top' => $describe($topAll), 'second' => $describe($secondAll)],
            'settings'     => $settings,
            'note'         => $settings->allowsRoom(null) ? null : 'ระบบเปิดใช้เฉพาะบางห้อง — ผลนี้ไม่ได้เช็คห้องของลูกค้า',
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $result = $this->kbService->destroy($id);
            if ($result['status']) {
                $status  = 200;
                $message = $result['message'];
            } else throw new \Exception($result['message']);
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail'  => $detail,
            ], $status);
        }
    }
}
