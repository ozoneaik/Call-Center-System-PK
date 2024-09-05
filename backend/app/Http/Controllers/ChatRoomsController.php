<?php

namespace App\Http\Controllers;

use App\Models\chat_rooms;
use Illuminate\Http\JsonResponse;

class ChatRoomsController extends Controller
{
    public function list() : JsonResponse{
        $chatRooms = chat_rooms::all();
        return response()->json([
            'message' => 'success',
            'chatRooms' => $chatRooms
        ]);
    }
}
