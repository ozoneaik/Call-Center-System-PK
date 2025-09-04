<?php

namespace App\Http\Controllers;

use App\Models\TagGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class TagGroupController extends Controller
{
    /**
     * GET /tag-group
     * ฟิลเตอร์ที่รองรับ:
     * - q: ค้นหาใน group_name / group_description
     * - group_id: partial match
     * - created_by: partial match (created_by_user_id)
     * - updated_by: partial match (updated_by_user_id)
     * - with_trashed: 1 แสดงรวมที่ลบแล้ว
     * - only_trashed: 1 แสดงเฉพาะที่ลบแล้ว
     * - per_page: ขนาดหน้า (ค่าเริ่มต้น 15)
     */
    public function index(Request $request): JsonResponse
    {
        $q = TagGroup::query();

        // trashed scopes
        if ($request->boolean('only_trashed')) {
            $q->onlyTrashed();
        } elseif ($request->boolean('with_trashed')) {
            $q->withTrashed();
        }

        // keyword search
        if ($kw = $request->get('q')) {
            $q->where(function ($qq) use ($kw) {
                $qq->where('group_name', 'ilike', "%{$kw}%")
                    ->orWhere('group_description', 'ilike', "%{$kw}%");
            });
        }

        if ($gid = $request->get('group_id')) {
            $q->where('group_id', 'ilike', "%{$gid}%");
        }

        if ($created = $request->get('created_by')) {
            $q->where('created_by_user_id', 'ilike', "%{$created}%");
        }

        if ($updated = $request->get('updated_by')) {
            $q->where('updated_by_user_id', 'ilike', "%{$updated}%");
        }

        // order ล่าสุดอยู่ก่อน
        $q->orderByDesc('created_at');

        $perPage = (int) ($request->get('per_page', 15)) ?: 15;
        $paginator = $q->paginate($perPage);

        return response()->json([
            'message' => 'success',
            'detail' => 'List tag groups',
            'data' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * GET /tag-group/{id}
     */
    public function show(int $id): JsonResponse
    {
        $tagGroup = TagGroup::withTrashed()->findOrFail($id);

        return response()->json([
            'message' => 'success',
            'detail' => 'Show tag group',
            'data' => $tagGroup,
        ]);
    }

    /**
     * POST /tag-group
     * ต้องส่ง: group_id (unique), group_name
     * ออปชัน: group_description
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'group_id'          => ['required', 'string', 'max:50', Rule::unique('tag_groups', 'group_id')->whereNull('deleted_at')],
            'group_name'        => ['required', 'string', 'max:255'],
            'group_description' => ['nullable', 'string', 'max:1000'],
        ]);

        // ✅ เหมือน TagMenu: ใช้ empCode ก่อน ถ้าไม่มีค่อย fallback เป็น id
        $actor   = Auth::user();
        $actorId = $actor?->empCode ?? (string) $actor?->id ?? null;

        $tagGroup = TagGroup::create([
            'group_id'            => $validated['group_id'],
            'group_name'          => $validated['group_name'],
            'group_description'   => $validated['group_description'] ?? null,
            'created_by_user_id'  => $actorId,
            'updated_by_user_id'  => $actorId,
        ]);

        return response()->json([
            'message' => 'success',
            'detail'  => 'Tag group created',
            'data'    => $tagGroup,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        // debug log แบบเดียวกับ TagMenuController (ถ้าต้องการ)
        Log::info('=== TAG-GROUP UPDATE DEBUG ===', [
            'id' => $id,
            'request_all' => $request->all(),
        ]);

        $status = 400;
        $detail = 'ไม่พบข้อผิดพลาด';

        // เผื่อบางที่อยาก validate รวม id
        $request->merge(['id' => $id]);

        $validated = $request->validate([
            'id' => ['required', 'integer', 'exists:tag_groups,id'],

            // อนุญาตอัปเดตทีละบางฟิลด์: ถ้าส่งมาก็ต้องไม่ว่าง
            'group_id' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('tag_groups', 'group_id')
                    ->whereNull('deleted_at')
                    ->ignore($id),
            ],
            'group_name' => ['sometimes', 'required', 'string', 'max:255'],
            'group_description' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $tagGroup = TagGroup::withTrashed()->findOrFail($id);

            $actor   = Auth::user();
            $actorId = $actor?->empCode ?? (string) $actor?->id ?? null;

            // เอาเฉพาะฟิลด์ที่ "ส่งมา" จริง ๆ (เหมือนแนว TagMenuController)
            $payload = [
                'updated_by_user_id' => $actorId,
            ];
            if ($request->has('group_id')) {
                $payload['group_id'] = $validated['group_id'];
            }
            if ($request->has('group_name')) {
                $payload['group_name'] = $validated['group_name'];
            }
            // group_description อนุญาต null ได้
            if ($request->has('group_description')) {
                $payload['group_description'] = $validated['group_description'] ?? null;
            }

            // อัปเดตด้วย fill/update (ต้องตั้ง $fillable ใน Model)
            $tagGroup->update($payload);

            $status  = 200;
            $message = 'อัปเดตสำเร็จ';
        } catch (\Exception $e) {
            $detail  = $e->getMessage();
            $message = 'เกิดข้อผิดพลาด';
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail'  => $detail,
                // 🔁 ให้คีย์ชื่อ "group" เหมือนฝั่ง Tag/Service ที่คุณใช้ (จะได้ไม่ต้องแก้ UI เยอะ)
                'group'   => isset($tagGroup) ? $tagGroup->fresh() : null,
            ], $status);
        }
    }

    /**
     * DELETE /tag-group/{id}  (Soft delete)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $tagGroup = TagGroup::findOrFail($id);

        // ✅ บันทึกคนลบเป็น empCode ด้วย
        $actor   = Auth::user();
        $actorId = $actor?->empCode ?? (string) $actor?->id ?? null;

        $tagGroup->deleted__by_user_id = $actorId;
        $tagGroup->save();

        $tagGroup->delete();

        return response()->json([
            'message' => 'success',
            'detail'  => 'Tag group soft-deleted',
        ]);
    }

    /**
     * PATCH /tag-group/{id}/restore  (กู้คืน)
     */
    public function restore(int $id): JsonResponse
    {
        $tagGroup = TagGroup::onlyTrashed()->findOrFail($id);
        $tagGroup->restore();

        return response()->json([
            'message' => 'success',
            'detail' => 'Tag group restored',
            'data' => $tagGroup->fresh(),
        ]);
    }

    /**
     * DELETE /tag-group/{id}/force  (ลบถาวร)
     */
    public function forceDelete(int $id): JsonResponse
    {
        $tagGroup = TagGroup::withTrashed()->findOrFail($id);
        $tagGroup->forceDelete();

        return response()->json([
            'message' => 'success',
            'detail' => 'Tag group permanently deleted',
        ]);
    }

    public function options()
    {
        // ดึงรายการกลุ่มที่ยังไม่ถูกลบ (ถ้าต้องการรวม soft-deleted ให้เอา whereNull ออก)
        $groups = TagGroup::query()
            ->select('id', 'group_id', 'group_name', 'group_description', 'deleted_at')
            ->whereNull('deleted_at')
            ->orderBy('group_name')
            ->get();

        // map เป็น options สำหรับ dropdown หน้าเว็บ
        return $groups->map(function ($g) {
            return [
                'value' => $g->group_id,
                'label' => $g->group_name . ' (' . $g->group_id . ')',
                'raw'   => [
                    'id'          => $g->id,
                    'group_id'    => $g->group_id,
                    'name'        => $g->group_name,
                    'description' => $g->group_description,
                    'deleted_at'  => $g->deleted_at,
                ],
            ];
        });
    }
}
