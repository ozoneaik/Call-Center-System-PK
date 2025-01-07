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
            ->leftJoin('chat_rooms', 'keywords.redirectTo', '=', 'chat_rooms.roomId')
            ->get();
        $chatRooms = ChatRooms::all();
        return response()->json([
            'keywords' => $keywords,
            'chatRooms' => $chatRooms
        ]);
    }

    public function store(Request $request)
    {
        $keyword = new Keyword();
        $keyword->name = $request->name;
        $keyword->redirectTo = $request->redirectTo;
        $keyword->save();
        return response()->json([
            'message' => 'Keyword created successfully'
        ]);
    }

    public function update(Request $request, $id)
    {
        $keyword = Keyword::find($id);
        $keyword->name = $request->name;
        $keyword->redirectTo = $request->redirectTo;
        $keyword->save();
        return response()->json([
            'message' => 'Keyword updated successfully'
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
