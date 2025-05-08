<?php

namespace App\Http\Controllers\webhooks;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FacebookController extends Controller
{
    public function webhook(Request $request)
    {
        Log::channel('facebook_webhook_log')->info('Facebook Webhook');
        $VERIFY_TOKEN = 'G_211044g'; // ใส่ให้ตรงกับที่กรอกในหน้า Facebook Developer Console
        if (
            request('hub_mode') === 'subscribe' &&
            request('hub_verify_token') === $VERIFY_TOKEN
        ) {
            Log::channel('facebook_webhook_log')->info('Facebook Webhook', [$request->all()]);
            return response(request('hub_challenge'), 200);
        }else{
            Log::channel('facebook_webhook_log')->error('Facebook Webhook Error');
            return response('Invalid token', 403);
        }
    }

    public function webhookFacebook(Request $request)
    {
        Log::channel('facebook_webhook_log')->info("Facebook Webhook\n" . json_encode($request->all(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        return response('OK', 200);
    }
}
