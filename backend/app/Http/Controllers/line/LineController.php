<?php

namespace App\Http\Controllers\line;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LineController extends Controller
{
    public function webhook(Request $request) : JsonResponse{
        Log::info('Showing {request}', ['request' => $request]);
        return response()->json([
            'response' => $request->all()
        ]);
    }
}
