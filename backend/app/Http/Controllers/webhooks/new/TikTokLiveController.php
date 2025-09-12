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
        $data = $request->all();
        Log::channel('webhook_tiktok_new')->info('TikTok Live Webhook Received', ['payload' => $data]);
    }
}