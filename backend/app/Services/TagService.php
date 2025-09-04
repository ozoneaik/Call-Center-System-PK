<?php

namespace App\Services;

use App\Models\TagMenu;
use Illuminate\Support\Facades\DB;

class TagService
{
    /** ========= Presenter กลาง เพื่อคงรูป JSON ให้สม่ำเสมอ ========= */
    private function presentTag(TagMenu $t): array
    {
        $g = $t->group;

        return [
            'id'                  => $t->id,
            'tagName'             => $t->tagName,
            'group_id'            => $t->group_id,
            'require_note'        => (bool) ($t->require_note ?? false),
            'created_by_user_id'  => $t->created_by_user_id,
            'updated_by_user_id'  => $t->updated_by_user_id,
            'deleted_by_user_id'  => $t->deleted_by_user_id,
            'deleted_at'          => $t->deleted_at,
            'created_at'          => $t->created_at,
            'updated_at'          => $t->updated_at,

            'group' => $g ? [
                'id'          => $g->id,
                'group_id'    => $g->group_id,
                'name'        => $g->group_name,
                'description' => $g->group_description,
                'deleted_at'  => $g->deleted_at,
            ] : null,
        ];
    }

    /** ========= List ========= */
    public function list(array $filters): array
    {
        $q = TagMenu::query()->with([
            'group:id,group_id,group_name,group_description,deleted_at',
        ]);

        // soft-delete filter
        if (!empty($filters['only_trashed'])) {
            $q->onlyTrashed();
        } elseif (!empty($filters['with_trashed'])) {
            $q->withTrashed();
        }

        // keyword on tagName
        if ($kw = $filters['name'] ?? null) {
            // ILIKE สำหรับ Postgres; ถ้าใช้ MySQL ให้เปลี่ยนเป็น like
            $q->where('tagName', 'ILIKE', "%{$kw}%");
        }

        // filter group by group_id หรือ group_name
        if ($grp = $filters['group'] ?? null) {
            $q->where(function ($qq) use ($grp) {
                $qq->where('group_id', 'ILIKE', "%{$grp}%")
                    ->orWhereHas('group', function ($gq) use ($grp) {
                        $gq->where('group_name', 'ILIKE', "%{$grp}%");
                    });
            });
        }

        if ($created = $filters['created_by'] ?? null) {
            $q->where('created_by_user_id', 'ILIKE', "%{$created}%");
        }

        if ($updated = $filters['updated_by'] ?? null) {
            $q->where('updated_by_user_id', 'ILIKE', "%{$updated}%");
        }

        if (array_key_exists('require_note', $filters) && $filters['require_note'] !== null) {
            $q->where('require_note', (bool) $filters['require_note']);
        }

        $page    = $filters['page'] ?? null;
        $perPage = $filters['per_page'] ?? 20;

        if ($page) {
            $paginator = $q->orderBy('id', 'desc')->paginate($perPage);
            $items = collect($paginator->items())
                ->map(fn($t) => $this->presentTag($t))
                ->all();

            return [
                'status'  => true,
                'message' => 'success',
                'list'    => $items,
                'meta'    => [
                    'current_page' => $paginator->currentPage(),
                    'per_page'     => $paginator->perPage(),
                    'total'        => $paginator->total(),
                    'last_page'    => $paginator->lastPage(),
                ],
            ];
        }

        $rows = $q->orderBy('id', 'desc')->get();

        return [
            'status'  => true,
            'message' => 'success',
            'list'    => $rows->map(fn($t) => $this->presentTag($t))->all(),
            'meta'    => null,
        ];
    }

    /** ========= Store ========= */
    public function store(array $payload): array
    {
        return DB::transaction(function () use ($payload) {
            $t = TagMenu::create($payload);
            $t->load('group:id,group_id,group_name,group_description,deleted_at');

            return [
                'status'  => true,
                'message' => 'created',
                'tag'     => $this->presentTag($t),
            ];
        });
    }

    /** ========= Update ========= */
    public function update(int $id, array $payload): array
    {
        return DB::transaction(function () use ($id, $payload) {
            $t = TagMenu::findOrFail($id);
            $t->fill($payload)->save();
            $t->load('group:id,group_id,group_name,group_description,deleted_at');

            return [
                'status'  => true,
                'message' => 'updated',
                'tag'     => $this->presentTag($t),
            ];
        });
    }

    /** ========= Delete (Soft) ========= */
    public function delete(int $id): array
    {
        $t = TagMenu::findOrFail($id);
        $t->delete();

        return [
            'status'  => true,
            'message' => 'deleted',
            'list'    => [], // ถ้าต้องการส่ง list ใหม่ให้ไปเรียก list() แยก
        ];
    }

    /** ========= Restore ========= */
    public function restore(int $id): array
    {
        $t = TagMenu::withTrashed()->findOrFail($id);
        $t->restore();

        return [
            'status'  => true,
            'message' => 'restored',
            'tag'     => $this->presentTag($t->load('group')),
        ];
    }

    /** ========= Force Delete ========= */
    public function forceDelete(int $id): array
    {
        $t = TagMenu::withTrashed()->findOrFail($id);
        $t->forceDelete();

        return [
            'status'  => true,
            'message' => 'force_deleted',
        ];
    }

    /** ========= Mark Deleted By ========= */
    public function markDeletedBy(int $id, ?string $actorId): void
    {
        if ($actorId === null) return;

        TagMenu::query()
            ->where('id', $id)
            ->update(['deleted_by_user_id' => $actorId]);
    }
}
