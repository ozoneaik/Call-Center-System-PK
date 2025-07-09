<?php

namespace App\Http\Controllers\webhooks;

use App\Http\Controllers\Controller;
use App\Models\PlatformAccessTokens;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FacebookController extends Controller
{
    public function webhookFacebook(Request $request)
    {
        Log::info('>>> Facebook POST webhook called');
        $req = $request->all();
        Log::info(json_encode($req, true));
        try {
            $access_token = PlatformAccessTokens::query()->where('platform', 'facebook')->first()->accessToken ?? null;
            $is_page = $req['object'] ?? null;
            $entry = $req['entry'] ?? [];
            if ($is_page === 'page') {
                if (count($entry) > 0) {
                    foreach ($entry as $e) {
                        if (isset($e['messaging']) && count($e['messaging']) > 0) {
                            $messaging = $e['messaging'];
                            foreach ($messaging as $m) {
                                $sender_id = $m['sender']['id'] ?? null;
                                if (isset($sender_id)) {
                                    $message = $m['message'] ?? [];
                                    if (isset($message)) {
                                        Log::info('Facebook webhook message: ' . json_encode($message));
                                        Log::info('access_token: ' . $access_token);
                                        Log::info('sender id: ' . $sender_id);
                                        $url = 'https://graph.facebook.com/v23.0/'.$sender_id.'/messages';
                                        $req = Http::withHeaders([
                                            'Authorization' => 'Bearer ' . $access_token,
                                            'Content-Type' => 'application/json',
                                        ])->post($url, [
                                            'messaging_type' => 'RESPONSE',
                                            'recipient' => [
                                                'id' => $sender_id
                                            ],
                                            'message' => [
                                                'text' => 'hello world'
                                            ]
                                        ]);
                                        if ($req->successful() && $req->status() === 200) {
                                            Log::info('ส่งข้อความสำเร็จ: ');
                                        } else Log::error('ส่งข้อความไม่สำเร็จ: ' . $req->body());
                                    } else throw new \Exception('Facebook webhook ไม่มีข้อมูล message');
                                } else throw new \Exception('Facebook webhook ไม่มีข้อมูล sender');
                            }
                        } else throw new \Exception('Facebook webhook ไม่มีข้อมูล messaging');
                    }
                } else throw new \Exception('Facebook webhook ไม่มีข้อมูล entry');
            } else throw new \Exception('Facebook webhook Object ไม่ใช่ page');
            return response('EVENT_RECEIVED', 200);
        } catch (\Exception $e) {
            Log::error('Facebook POST webhook error: ' . $e->getMessage());
            return response('EVENT_RECEIVED', 200);
        }
    }

    public function webhook(Request $request)
    {
        Log::info('>>> Facebook GET webhook verify called');
        Log::info($request->query());

        $verify_token = env('FACEBOOK_VERIFY_PASSWORD', 'G_211044g');
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        if ($mode === 'subscribe' && $token === $verify_token) {
            return response($challenge, 200);
        }

        return response('Forbidden', 403);
    }
}
