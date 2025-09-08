<?php

namespace App\Http\Controllers;

use App\Models\TagByPlatforms;
use App\Models\TagMenu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TagsByPlatformController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('tag_by_platforms')
            ->join('tag_menus', 'tag_by_platforms.tag_id', '=', 'tag_menus.id')
            ->select(
                'tag_by_platforms.*',
                'tag_menus.tagName'
            )
            ->orderBy('tag_by_platforms.created_at', 'desc');

        if ($request->filled('platform_name')) {
            $query->where('platform_name', $request->platform_name);
        }

        if ($request->filled('tag_id')) {
            $query->where('tag_id', $request->tag_id);
        }

        $data = $query->get();

        return response()->json([
            'status' => true,
            'data' => $data
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'platform_name' => 'required|string|max:255',
            'tag_id' => 'required|integer',
        ]);

        $exists = DB::table('tag_by_platforms')
            ->where('platform_name', $validated['platform_name'])
            ->where('tag_id', $validated['tag_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'status' => false,
                'message' => 'แท็กนี้ถูกเลือกใช้ไปแล้วในแพลตฟอร์มนี้'
            ], 409);
        }

        $store = TagByPlatforms::query()->create([
            'platform_name' => $validated['platform_name'],
            'tag_id' => $validated['tag_id'],
        ]);

        return response()->json([
            'status' => true,
            'id' => $store->id,
            'new_record' => $store,
            'message' => 'เพิ่มข้อมูลสำเร็จ'
        ]);
    }

    public function show($id)
    {
        $record = DB::table('tag_by_platforms')->find($id);
        if (!$record) {
            return response()->json(['status' => false, 'message' => 'ไม่พบข้อมูล'], 404);
        }
        return response()->json(['status' => true, 'data' => $record]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'platform_name' => 'required|string|max:255',
            'tag_id' => 'required|integer',
        ]);

        $exists = DB::table('tag_by_platforms')
            ->where('platform_name', $validated['platform_name'])
            ->where('tag_id', $validated['tag_id'])
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            return response()->json([
                'status' => false,
                'message' => 'แท็กนี้ถูกเพิ่มไปแล้วในแพลตฟอร์มเดียวกัน'
            ], 409);
        }

        $current = DB::table('tag_by_platforms')->where('id', $id)->first();
        if (!$current) {
            return response()->json([
                'status' => false,
                'message' => 'ไม่พบข้อมูล'
            ], 404);
        }

        if (
            $current->platform_name === $validated['platform_name'] &&
            $current->tag_id == $validated['tag_id']
        ) {
            return response()->json([
                'status' => true,
                'message' => 'ไม่มีการเปลี่ยนแปลง'
            ]);
        }

        DB::table('tag_by_platforms')
            ->where('id', $id)
            ->update([
                'platform_name' => $validated['platform_name'],
                'tag_id' => $validated['tag_id'],
                'updated_at' => now(),
            ]);

        return response()->json([
            'status' => true,
            'message' => 'แก้ไขข้อมูลสำเร็จ'
        ]);
    }

    public function platforms()
    {
        $platforms = DB::table('platform_access_tokens')
            ->select('platform')
            ->distinct()
            ->orderBy('platform', 'asc')
            ->get();

        return response()->json([
            'status' => true,
            'data' => $platforms
        ]);
    }

    public function tags(Request $request)
    {
        $usedTags = DB::table('tag_by_platforms')
            ->pluck('tag_id')
            ->toArray();

        $tags = TagMenu::select('id', 'tagName')
            ->whereNotIn('id', $usedTags) 
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'status' => true,
            'data' => $tags
        ]);
    }

    public function destroy($id)
    {
        $deleted = DB::table('tag_by_platforms')->where('id', $id)->delete();

        return response()->json([
            'status' => $deleted > 0,
            'message' => $deleted ? 'ลบข้อมูลสำเร็จ' : 'ไม่พบข้อมูล'
        ]);
    }
}
