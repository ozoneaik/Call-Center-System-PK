<?php

namespace App\Http\Controllers;

use App\Services\TagService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class TagMenuController extends Controller
{
    protected TagService $tagService;

    public function __construct(TagService $tagService)
    {
        $this->tagService = $tagService;
    }

    public function list(Request $request): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่พบข้อผิดพลาด';

        $validated = $request->validate([
            'name'          => ['nullable', 'string', 'max:255'],
            'group'         => ['nullable', 'string', 'max:255'],
            'created_by'    => ['nullable', 'string', 'max:255'],
            'updated_by'    => ['nullable', 'string', 'max:255'],
            'require_note'  => ['nullable', Rule::in(['true', 'false', 1, 0, '1', '0'])],
            'with_trashed'  => ['nullable', Rule::in(['true', 'false', 1, 0, '1', '0'])],
            'only_trashed'  => ['nullable', Rule::in(['true', 'false', 1, 0, '1', '0'])],
            'page'          => ['nullable', 'integer', 'min:1'],
            'per_page'      => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        try {
            $filters = [
                'name'         => $validated['name'] ?? null,
                'group'        => $validated['group'] ?? null,
                'created_by'   => $validated['created_by'] ?? null,
                'updated_by'   => $validated['updated_by'] ?? null,
                // true/false/null เท่านั้น
                'require_note' => isset($validated['require_note'])
                    ? filter_var($validated['require_note'], FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE)
                    : null,
                'with_trashed' => isset($validated['with_trashed'])
                    ? filter_var($validated['with_trashed'], FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE)
                    : false,
                'only_trashed' => isset($validated['only_trashed'])
                    ? filter_var($validated['only_trashed'], FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE)
                    : false,
                'page'         => $validated['page'] ?? null,
                'per_page'     => $validated['per_page'] ?? null,
            ];

            $list = $this->tagService->list($filters);
            if ($list['status']) {
                $status = 200;
            } else {
                throw new \Exception($list['message']);
            }
            $message = $list['message'];
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail'  => $detail,
                'list'    => $list['list'] ?? [],
                'meta'    => $list['meta'] ?? null,
            ], $status);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่พบข้อผิดพลาด';

        $validated = $request->validate([
            'tagName'      => ['required', 'string', 'max:255', 'unique:tag_menus,tagName'],
            'group_id'     => ['nullable', 'string', 'max:255'],
            'require_note' => ['nullable', 'boolean'], // ตรวจรูปแบบเท่านั้น
        ]);

        try {
            $actor   = Auth::user();
            $actorId = $actor?->empCode ?? (string) $actor?->id ?? null;

            // แก้ไขวิธีการแปลงค่า require_note
            $requireNote = null;
            if ($request->has('require_note')) {
                $rawValue = $request->input('require_note');

                // แปลงค่าให้ชัดเจน
                if (is_bool($rawValue)) {
                    $requireNote = $rawValue;
                } else if (is_string($rawValue)) {
                    $requireNote = in_array(strtolower($rawValue), ['true', '1'], true);
                } else if (is_numeric($rawValue)) {
                    $requireNote = (bool)(int)$rawValue;
                }
            }

            $payload = [
                'tagName'            => $validated['tagName'],
                'group_id'           => $validated['group_id'] ?? null,
                'created_by_user_id' => $actorId,
                'updated_by_user_id' => $actorId,
            ];

            // ใส่เฉพาะเมื่อมีค่า
            if ($requireNote !== null) {
                $payload['require_note'] = $requireNote;
            }

            $res = $this->tagService->store($payload);
            if ($res['status']) {
                $status = 200;
            } else {
                throw new \Exception($res['message']);
            }
            $message = $res['message'];
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail'  => $detail,
                'tag'     => $res['tag'] ?? [],
            ], $status);
        }
    }

    /**
     * PUT /tags/{id}
     * รองรับการอัปเดตทุกฟิลด์ (unique tagName แบบ ignore id)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        Log::info('=== UPDATE DEBUG ===', [
            'request_all' => $request->all(),
            'require_note_raw' => $request->input('require_note'),
            'require_note_type' => gettype($request->input('require_note')),
            'has_require_note' => $request->has('require_note'),
        ]);
        $status = 400;
        $detail = 'ไม่พบข้อผิดพลาด';
        $request->merge(['id' => $id]);

        $validated = $request->validate([
            'id'       => ['required', 'integer', 'exists:tag_menus,id'],
            'tagName'  => ['required', 'string', 'max:255', Rule::unique('tag_menus', 'tagName')->ignore($id)],
            'group_id' => ['nullable', 'string', 'max:255'],
            'require_note' => ['nullable', 'boolean'],
        ]);

        try {
            $actor   = Auth::user();
            $actorId = $actor?->empCode ?? (string) $actor?->id ?? null;

            // แก้ไขวิธีการแปลงค่า require_note
            $requireNote = null;
            if ($request->has('require_note')) {
                $rawValue = $request->input('require_note');

                // แปลงค่าให้ชัดเจน
                if (is_bool($rawValue)) {
                    $requireNote = $rawValue;
                } else if (is_string($rawValue)) {
                    $requireNote = in_array(strtolower($rawValue), ['true', '1'], true);
                } else if (is_numeric($rawValue)) {
                    $requireNote = (bool)(int)$rawValue;
                }
            }

            $payload = [
                'tagName'            => $validated['tagName'],
                'group_id'           => $validated['group_id'] ?? null,
                'updated_by_user_id' => $actorId,
            ];

            if ($requireNote !== null) {
                $payload['require_note'] = $requireNote;
            }

            $res = $this->tagService->update($id, $payload);
            if ($res['status']) {
                $status = 200;
            } else {
                throw new \Exception($res['message']);
            }
            $message = $res['message'];
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail'  => $detail,
                'tag'     => $res['tag'] ?? [],
            ], $status);
        }
    }

    /**
     * DELETE /tags/{id}
     * ใช้ SoftDelete
     */
    public function delete($id): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่พบข้อผิดพลาด';

        try {
            $actor   = Auth::user();
            $actorId = $actor?->empCode ?? (string) $actor?->id ?? null;

            $this->tagService->markDeletedBy((int)$id, $actorId);

            $res = $this->tagService->delete((int)$id);
            if ($res['status']) {
                $status = 200;
            } else {
                throw new \Exception($res['message']);
            }
            $message = $res['message'];
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail'  => $detail,
                'list'    => $res['list'] ?? [],
            ], $status);
        }
    }

    public function restore(int $id): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่พบข้อผิดพลาด';

        try {
            $res = $this->tagService->restore($id);
            if ($res['status']) {
                $status = 200;
            } else {
                throw new \Exception($res['message']);
            }
            $message = $res['message'];
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail'  => $detail,
                'tag'     => $res['tag'] ?? null,
            ], $status);
        }
    }

    public function forceDelete(int $id): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่พบข้อผิดพลาด';

        try {
            $res = $this->tagService->forceDelete($id);
            if ($res['status']) {
                $status = 200;
            } else {
                throw new \Exception($res['message']);
            }
            $message = $res['message'];
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
