<?php

namespace App\Http\Controllers;

use App\Models\TagByPlatforms;
use App\Models\TagMenu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TagsByPlatformController extends Controller
{

    public function index()
    {
        $data = DB::table('tag_by_platforms')
            ->orderBy('created_at', 'desc')
            ->get();

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

    /**
     * ดูข้อมูลตาม id
     */
    public function show($id)
    {
        $record = DB::table('tag_by_platforms')->find($id);

        if (!$record) {
            return response()->json(['status' => false, 'message' => 'ไม่พบข้อมูล'], 404);
        }

        return response()->json(['status' => true, 'data' => $record]);
    }

    /**
     * แก้ไขข้อมูล
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'platform_name' => 'required|string|max:255',
            'tag_id' => 'required|integer',
        ]);

        $updated = DB::table('tag_by_platforms')
            ->where('id', $id)
            ->update([
                'platform_name' => $validated['platform_name'],
                'tag_id' => $validated['tag_id'],
                'updated_at' => now(),
            ]);

        return response()->json([
            'status' => $updated > 0,
            'message' => $updated ? 'แก้ไขข้อมูลสำเร็จ' : 'ไม่พบข้อมูล'
        ]);
    }

    public function platforms()
    {
        $platforms = DB::table('platform_access_tokens')
            ->select('id', 'platform')
            ->orderBy('platform', 'asc')
            ->get();

        return response()->json([
            'status' => true,
            'data' => $platforms
        ]);
    }
    public function tags()
    {
        $tags = TagMenu::select('id', 'tagName')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'status' => true,
            'data' => $tags
        ]);
    }

    /**
     * ลบข้อมูล
     */
    public function destroy($id)
    {
        $deleted = DB::table('tag_by_platforms')->where('id', $id)->delete();

        return response()->json([
            'status' => $deleted > 0,
            'message' => $deleted ? 'ลบข้อมูลสำเร็จ' : 'ไม่พบข้อมูล'
        ]);
    }
}
