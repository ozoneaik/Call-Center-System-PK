<?php

namespace App\Http\Controllers;

use App\Models\AnnounceModel;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AnnounceController extends Controller
{
    public function index(){
        $now = Carbon::now();
        $announces = AnnounceModel::query()
            ->where('start_at', '<=', $now)
            ->where('end_at', '>=', $now)
            ->get();
        return response()->json([
            'announces' => $announces
        ]);
    }

    public function list_all () {
        
        $list = AnnounceModel::query()->paginate(100);
        dump($list->toArray());
        return response()->json($list);
    }

    public function update(Request $request, $id){
        $data = $request->all();
        dump($request->all());
        $announce = AnnounceModel::find($id);
        $detail_text = $data['detail_text'] ?? null;
        $start_at = Carbon::parse($data['start_at'] ?? null);
        $end_at = Carbon::parse($data['end_at'] ?? null);
        if ($announce) {
            $announce->update([
                'detail_text' => $detail_text,
                'start_at' => $start_at,
                'end_at' => $end_at,
                'is_active' => $data['is_active'] ?? true,
            ]);
            return response()->json([
                'message' => 'Update successful',
                'data' => $announce,
                'request' => $data
            ]);
        } else {
            return response()->json([
                'message' => 'Announce not found'
            ], 404);
        }
    }

    public function store(Request $request){
        $data = $request->all();
        $announce = AnnounceModel::create($data);
        return response()->json([
            'message' => 'Create successful',
            'data' => $announce
        ]);
    }

    public function destroy($id){
        $announce = AnnounceModel::find($id);
        if ($announce) {
            $announce->delete();
            return response()->json([
                'message' => 'Delete successful'
            ]);
        } else {
            return response()->json([
                'message' => 'Announce not found'
            ], 404);
        }
    }
}
