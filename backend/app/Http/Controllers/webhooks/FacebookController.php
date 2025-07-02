<?php

namespace App\Http\Controllers\webhooks;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FacebookController extends Controller
{
    public function webhookFacebook(Request $request)
    {
        Log::info('>>> Facebook POST webhook called');
        Log::info($request->all());

        return response('EVENT_RECEIVED', 200);
    }

    public function webhook(Request $request)
    {
        Log::info('>>> Facebook GET webhook verify called');
        Log::info($request->query());

        $verify_token = 'G_211044g';
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        if ($mode === 'subscribe' && $token === $verify_token) {
            return response($challenge, 200);
        }

        return response('Forbidden', 403);
    }
}
