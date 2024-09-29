<?php

namespace App\Http\Controllers;

use App\Services\DisplayService;
use Illuminate\Http\JsonResponse;

class DisplayController extends Controller
{
    protected DisplayService  $displayService;
    public function __construct(DisplayService $displayService){
        $this->displayService = $displayService;
    }

    public function displayMessageList($roomId) : JsonResponse{
        $pending = $this->displayService->MessageList($roomId,'pending');
        $progress = $this->displayService->MessageList($roomId,'progress');
        return response()->json([
            'message' => 'displayMessageList',
            'pending' => $pending,
            'progress' => $progress
        ]);
    }

    public function selectMessage($rateId, $activeId, $custId): JsonResponse
    {
        return response()->json([$rateId, $activeId, $custId]);
    }

}
