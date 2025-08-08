<?php

namespace App\Http\Controllers;

use App\Models\TagGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TagGroupController extends Controller
{
    //
    public function list(): JsonResponse
    {
        try {
            $groups = TagGroup::all();
            return response()->json([
                'message' => 'โหลดกลุ่มแท็กสำเร็จ',
                'detail' => '',
                'list' => $groups,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'เกิดข้อผิดพลาด',
                'detail' => $e->getMessage(),
                'list' => [],
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'group_name' => 'required|string|max:255',
            'group_description' => 'nullable|string',
        ]);

        try {
            $group = TagGroup::create([
                'group_name' => $request->group_name,
                'group_description' => $request->group_description,
            ]);

            return response()->json([
                'message' => 'สร้างกลุ่มแท็กสำเร็จ',
                'detail' => '',
                'group' => $group,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'เกิดข้อผิดพลาดในการสร้างกลุ่มแท็ก',
                'detail' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        $request->validate([
            'group_name' => 'required|string|max:255',
            'group_description' => 'nullable|string',
        ]);

        try {
            $group = TagGroup::findOrFail($id);
            $group->update([
                'group_name' => $request->group_name,
                'group_description' => $request->group_description,
            ]);

            return response()->json([
                'message' => 'อัปเดตกลุ่มแท็กสำเร็จ',
                'detail' => '',
                'group' => $group,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'เกิดข้อผิดพลาดในการอัปเดตกลุ่มแท็ก',
                'detail' => $e->getMessage(),
            ], 500);
        }
    }

    public function delete($id): JsonResponse
    {
        try {
            $group = TagGroup::findOrFail($id);
            $group->delete();

            return response()->json([
                'message' => 'ลบกลุ่มแท็กสำเร็จ',
                'detail' => '',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'เกิดข้อผิดพลาดในการลบกลุ่มแท็ก',
                'detail' => $e->getMessage(),
            ], 500);
        }
    }
}
