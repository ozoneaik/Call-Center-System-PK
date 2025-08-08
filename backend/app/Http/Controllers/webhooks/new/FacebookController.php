<?php

namespace App\Http\Controllers\webhooks\new;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FacebookController extends Controller
{
    public function verifyToken(Request $request)
    {
        $verify_token = '211044';
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');
        if ($mode === 'subscribe' && $token === $verify_token) {
            return response($challenge, 200);
        }
        return response('Forbidden', 403);
    }

    public function webhook(Request $request) {
        Log::channel('webhook_facebook_new')->info('เริ่มรับ webhook จาก Facebook');
        Log::channel('webhook_facebook_new')->info(json_encode($request->all(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        return response()->json([
            'message' => 'ตอบกลับ webhook สําเร็จ',
        ], 200);
    }
}
