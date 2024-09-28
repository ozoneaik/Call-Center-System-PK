<?php

namespace App\Http\Controllers;

use App\Models\ChatRooms;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatRoomsController extends Controller
{
    public function list() : JsonResponse{
        $chatRooms = ChatRooms::all();
        return response()->json([
            'message' => 'success',
            'chatRooms' => $chatRooms
        ]);
    }

    public function store(Request $request) : JsonResponse{
        return response()->json([
            'message' => 'ChatRooms Store',
        ]);
    }

    public function update($roomId) : JsonResponse{
        return response()->json([
            'message' => "ChatRooms Update $roomId",
        ]);
    }

    public function delete($roomId) : JsonResponse{
        return response()->json([
            'message' => "ChatRooms Delete $roomId",
        ]);
    }
}
