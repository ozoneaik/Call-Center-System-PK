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

    public function list() : JsonResponse{
        return response()->json([
            'list' => $this->shortChatService->list(),
        ]);
    }

    public function store() : JsonResponse{
        return response()->json([
            'message' => 'store'
        ]);
    }


    public function update($id) : JsonResponse{
        return response()->json([
            'message' => "update $id"
        ]);
    }


    public function delete($id) : JsonResponse{
        return response()->json([
            'message' => "delete $id"
        ]);
    }

}
