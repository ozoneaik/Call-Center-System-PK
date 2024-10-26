<?php

namespace App\Http\Controllers;

use App\Services\BotService;
use Illuminate\Http\JsonResponse;

class BotMenuController extends Controller
{
    protected BotService $botService;
    public function __construct(BotService $botService){
        $this->botService = $botService;
    }
    public function botList() : JsonResponse{
        $list = $this->botService->list();
        return response()->json([
            'list' => $list
        ]);
    }
}
