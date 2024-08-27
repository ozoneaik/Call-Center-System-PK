<?php

namespace App\Http\Controllers\line;

use App\Http\Controllers\Controller;
use App\Models\chatHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LineController extends Controller
{
    public function webhook(Request $request) : JsonResponse{
        $res = $request->all();
        $events = $res["events"];
        if (count($events) > 0) {
//            if ($events[0]["type"] === "event") {
//                $chatHistory = new chatHistory();
//                $chatHistory->custId = $events[0]['source']['userId'];
//                $chatHistory->textMessage = $events[0]['message']['text'];
//                $chatHistory->save();
//            }
        }
        Log::info('Showing request', ['request' => json_encode($res, JSON_PRETTY_PRINT)]);
        return response()->json([
            'response' => $request->all()
        ]);
    }
}
