<?php

namespace App\Services;

use App\Models\TagMenu;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TagService
{
    public function list(array $filters = []): array
    {
        try {
            $q = TagMenu::query()->select([
                'id',
                'tagName',
                'group_id',
                'require_note',
                'created_by_user_id',
                'updated_by_user_id',
                'deleted_by_user_id',
                'created_at',
                'updated_at',
                'deleted_at',
            ]);

            // Trashed scope
            $withTrashed = (bool)($filters['with_trashed'] ?? false);
            $onlyTrashed = (bool)($filters['only_trashed'] ?? false);

            if ($onlyTrashed) {
                $q->onlyTrashed();
            } elseif ($withTrashed) {
                $q->withTrashed();
            }

            // Filters
            if (!empty($filters['name'])) {
                $name = trim($filters['name']);
                $q->where('tagName', 'ILIKE', "%{$name}%");
            }

            if (!empty($filters['group'])) {
                $group = trim($filters['group']);
                $q->where('group_id', 'ILIKE', "%{$group}%");
            }

            if (!empty($filters['created_by'])) {
                $createdBy = trim($filters['created_by']);
                $q->where('created_by_user_id', 'ILIKE', "%{$createdBy}%");
            }

            if (!empty($filters['updated_by'])) {
                $updatedBy = trim($filters['updated_by']);
                $q->where('updated_by_user_id', 'ILIKE', "%{$updatedBy}%");
            }

            // กรอง require_note เฉพาะเมื่อมีค่า (true/false) ไม่ใช่ null
            if (array_key_exists('require_note', $filters) && $filters['require_note'] !== null) {
                $q->where('require_note', (bool)$filters['require_note']);
            }

            $q->orderBy('id', 'asc');

            // Pagination (optional)
            $page    = isset($filters['page']) ? max(1, (int)$filters['page']) : null;
            $perPage = isset($filters['per_page']) ? max(1, min(200, (int)$filters['per_page'])) : null;

            if ($page && $perPage) {
                /** @var LengthAwarePaginator $p */
                $p = $q->paginate($perPage, ['*'], 'page', $page);
                return [
                    'status'  => true,
                    'message' => 'สำเร็จ',
                    'list'    => $p->items(),
                    'meta'    => [
                        'current_page' => $p->currentPage(),
                        'per_page'     => $p->perPage(),
                        'total'        => $p->total(),
                        'last_page'    => $p->lastPage(),
                    ],
                ];
            }

            $rows = $q->get();

            return [
                'status'  => true,
                'message' => 'สำเร็จ',
                'list'    => $rows,
                'meta'    => null,
            ];
        } catch (\Throwable $e) {
            return [
                'status'  => false,
                'message' => $e->getMessage(),
                'list'    => [],
                'meta'    => null,
            ];
        }
    }

    public function store(array $payload): array
    {
        DB::beginTransaction();
        try {
            $tag = new TagMenu();
            $tag->tagName            = $payload['tagName'];
            $tag->group_id           = $payload['group_id'] ?? null;

            if (array_key_exists('require_note', $payload) && $payload['require_note'] !== null) {
                $tag->require_note = (bool)$payload['require_note'];
            }

            $tag->created_by_user_id = $payload['created_by_user_id'] ?? null;
            $tag->updated_by_user_id = $payload['updated_by_user_id'] ?? null;
            $tag->save();

            DB::commit();
            return ['status' => true, 'message' => 'บันทึกสำเร็จ', 'tag' => $tag->fresh()];
        } catch (\Throwable $e) {
            DB::rollBack();
            return ['status' => false, 'message' => $e->getMessage(), 'tag' => null];
        }
    }


    public function update(int $id, array $payload): array
    {
        DB::beginTransaction();
        try {
            $tag = TagMenu::withTrashed()->findOrFail($id);
            $tag->tagName  = $payload['tagName'];
            $tag->group_id = $payload['group_id'] ?? null;

            if (array_key_exists('require_note', $payload) && $payload['require_note'] !== null) {
                $tag->require_note = (bool)$payload['require_note'];
            }

            if (array_key_exists('updated_by_user_id', $payload)) {
                $tag->updated_by_user_id = $payload['updated_by_user_id'];
            }

            $tag->save();

            DB::commit();
            return ['status' => true, 'message' => 'อัปเดตสำเร็จ', 'tag' => $tag->fresh()];
        } catch (\Throwable $e) {
            DB::rollBack();
            return ['status' => false, 'message' => $e->getMessage(), 'tag' => null];
        }
    }

    public function markDeletedBy(int $id, ?string $actorId): void
    {
        if ($actorId === null) return;
        TagMenu::whereKey($id)->update(['deleted_by_user_id' => $actorId]);
    }

    /**
     * ลบแบบ Soft Delete
     */
    public function delete(int $id): array
    {
        DB::beginTransaction();
        try {
            /** @var TagMenu $tag */
            $tag = TagMenu::findOrFail($id);
            $tag->delete(); // soft delete

            DB::commit();

            return [
                'status'  => true,
                'message' => 'ลบสำเร็จ',
                'list'    => [],
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            return [
                'status'  => false,
                'message' => $e->getMessage(),
                'list'    => [],
            ];
        }
    }

    public function restore(int $id): array
    {
        DB::beginTransaction();
        try {
            /** @var TagMenu $tag */
            $tag = TagMenu::onlyTrashed()->findOrFail($id);
            $tag->restore();

            DB::commit();

            return [
                'status'  => true,
                'message' => 'กู้คืนสำเร็จ',
                'tag'     => $tag->fresh(),
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            return [
                'status'  => false,
                'message' => $e->getMessage(),
                'tag'     => null,
            ];
        }
    }

    public function forceDelete(int $id): array
    {
        DB::beginTransaction();
        try {
            /** @var TagMenu $tag */
            $tag = TagMenu::withTrashed()->findOrFail($id);
            $tag->forceDelete();

            DB::commit();

            return [
                'status'  => true,
                'message' => 'ลบถาวรสำเร็จ',
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            return [
                'status'  => false,
                'message' => $e->getMessage(),
            ];
        }
    }
}
