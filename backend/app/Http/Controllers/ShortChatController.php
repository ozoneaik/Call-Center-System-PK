<?php

namespace App\Http\Controllers;

use App\Services\shortChatService;
use Illuminate\Http\JsonResponse;

class ShortChatController extends Controller
{
    protected shortChatService $shortChatService;
    public function __construct(shortChatService $shortChatService){
        $this->shortChatService = $shortChatService;
    }
    public function shortChatList() :JsonResponse{
        $short_chats = $this->shortChatService->shortChatList();
        return response()->json([
            'message' => 'success',
            'short_chats' => $short_chats
        ]);
    }
}
