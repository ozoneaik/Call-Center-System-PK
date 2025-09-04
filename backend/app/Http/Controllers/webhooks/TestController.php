<?php

namespace App\Http\Controllers\webhooks;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class TestController extends Controller
{
    public function webhook(Request $request) {
        Log::channel('facebook_webhook_log')->info('----------------------------------------------');
        Log::channel('facebook_webhook_log')->info('>>> Facebook POST webhook called');
        $req = $request->all();
        Log::channel('facebook_webhook_log')->info(json_encode($req, true));
        return response()->json([
            'message' => 'Test webhook received successfully',
        ]);
    }
}
