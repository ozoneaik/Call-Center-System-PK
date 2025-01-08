<?php

namespace App\Http\Controllers;

use App\Models\ChatRooms;
use App\Models\Keyword;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KeywordController extends Controller
{
    public function list()
    {
        $keywords = DB::table('keywords')
            ->leftJoin('chat_rooms', 'keywords.redirectTo', '=', 'chat_rooms.roomId')->orderBy('keywords.id', 'asc')
            ->select('keywords.*', 'chat_rooms.roomName')
            ->get();
        $chatRooms = ChatRooms::all();
        return response()->json([
            'keywords' => $keywords,
            'chatRooms' => $chatRooms
        ]);
    }

    public function store(Request $request)
    {
        try {
            $keyword = new Keyword();
            $keyword->name = $request->name;
            $keyword->redirectTo = $request->redirectTo;
            $keyword->save();
            return response()->json([
                'message' => 'สร้าง Keyword สำเร็จ',
                'keyword' => $keyword
            ],200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ],400);
        }
    }

    public function update(Request $request, $id)
    {
        $keyword = Keyword::find($id);
        $keyword->name = $request->name;
        $keyword->redirectTo = $request->redirectTo;
        $keyword->save();
        return response()->json([
            'message' => 'Keyword updated successfully',
            'keyword' => $request->all()
        ]);
    }

    public function delete($id)
    {
        $keyword = Keyword::find($id);
        $keyword->delete();
        return response()->json([
            'message' => 'Keyword deleted successfully'
        ]);
    }
}
