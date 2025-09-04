<?php

namespace App\Http\Controllers;

use App\Models\StickerModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StickerModelController extends Controller
{
    public function index() {
        return response()->json([
            'list' => StickerModel::orderBy('id', 'desc')->get()
        ]);
    }

    public function store(Request $request) {
        try{
            DB::beginTransaction();
            $sticker = StickerModel::query()->create([
                'path' => $request->input('path'),
                'is_active' => $request->input('is_active')
            ]);
            DB::commit();
            return response()->json([
                'message' => 'สติกเกอร์ถูกสร้างเรียบร้อยแล้ว',
                'sticker' => $sticker
            ]);
        }catch(\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function update(Request $request,$id){
        try{
            DB::beginTransaction();
            $sticker = StickerModel::query()->findOrFail($id);
            $sticker->update([
                'path' => $request->input('path'),
                'is_active' => $request->input('is_active')
            ]);
            DB::commit();
            return response()->json([
                'message' => 'อัพเดทสติกเกอร์เรียบร้อยแล้ว',
                'sticker' => $sticker
            ]);
        }catch(\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function delete($id){
        try{
            DB::beginTransaction();
            $sticker = StickerModel::query()->findOrFail($id);
            $sticker->delete();
            DB::commit();
            return response()->json([
                'message' => 'ลบสติกเกอร์เรียบร้อยแล้ว',
            ]);
        }catch(\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
