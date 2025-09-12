<?php

namespace App\Http\Controllers\webhooks\new;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TikTokLiveController extends Controller
{
    //
    public function webhooksLive(Request $request)
    {
        try {
            $data = $request->all();
            Log::channel('webhook_tiktok_new')->info('TikTok Live Webhook Received', [
                'payload' => $data
            ]);
            return response()->json(['status' => 'success'], 200);
        } catch (\Exception $e) {
            Log::channel('webhook_tiktok_new')->error('Error processing TikTok Live webhook', [
                'error' => $e->getMessage()
            ]);
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}