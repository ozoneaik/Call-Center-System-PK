<?php

namespace App\Http\Controllers;

use App\Services\ShortChatService;
use Illuminate\Http\JsonResponse;

class ShortChatController extends Controller
{
    protected ShortChatService  $shortChatService;
    public function __construct(ShortChatService $shortChatService){
        $this->shortChatService = $shortChatService;
    }
    public function shortChatList() :JsonResponse{
        $ShortChats = $this->shortChatService->list();
        return response()->json([
            'message' => 'success',
            'short_chats' => $ShortChats
        ]);
    }
}
