<?php

namespace App\Http\Controllers\webhooks;

use App\Http\Controllers\Controller;
use App\Models\Rates;
use App\Models\User;
use App\Services\webhooks\FacebookMessageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use PDO;

class FacebookController extends Controller
{

    protected FacebookMessageService $facebookMessageService;
    public function __construct(FacebookMessageService $facebookMessageService)
    {
        $this->facebookMessageService = $facebookMessageService;
    }

    public function webhookFacebook(Request $request)
    {
        $BOT = User::query()->where('empCode', 'BOT')->first();
        Log::channel('facebook_webhook_log')->info('----------------------------------------------');
        Log::channel('facebook_webhook_log')->info('>>> Facebook POST webhook called');
        $req = $request->all();
        Log::channel('facebook_webhook_log')->info(json_encode($req, true));
        try {
            $is_page = $req['object'] ?? null;
            $entry = $req['entry'] ?? [];
            if ($is_page === 'page') {
                if (count($entry) > 0) {
                    foreach ($entry as $e) {
                        $fb_page_id = $e['id'];
                        Log::channel('facebook_webhook_log')->info('Page Id : ' . $fb_page_id);
                        if (isset($e['messaging']) && count($e['messaging']) > 0) {
                            $messaging = $e['messaging'];
                            foreach ($messaging as $m) {
                                $sender_id = $m['sender']['id'] ?? null;
                                if (isset($sender_id)) {
                                    if ($sender_id === $fb_page_id) throw new \Exception("ผู้ส่งรหัสเดียวกับเพจ");
                                    // ดึงข้อมูลผู้ใช้จาก Facebook
                                    $customer = $this->facebookMessageService->getProfile($sender_id);
                                    Log::channel('facebook_webhook_log')->info('Facebook webhook customer: ' . json_encode($customer));
                                    if ($customer['status']) {
                                        $access_token = $customer['customer']['accessToken'];
                                        $customer = $customer['customer'];
                                        $message = $m['message'] ?? null;
                                        if (isset($message)) {
                                            Log::channel('facebook_webhook_log')->info('Facebook webhook message: ' . json_encode($message));
                                            // กรองเคสข้อความ
                                            $current_rate = Rates::query()->where('custId', $customer['custId'])
                                                ->orderBy('id', 'desc')->first();
                                            if (isset($current_rate)) {
                                                if ($current_rate->status === 'pendig') {
                                                    $this->messageCasePending();
                                                } elseif ($current_rate->status === 'progress') {
                                                    $this->messageCaseProgress();
                                                } elseif ($current_rate->status === 'success') {
                                                    $this->messageCaseSuccess();
                                                } elseif ($current_rate->status === 'new') {
                                                    $this->messageCaseNew();
                                                } else {
                                                    $this->messageCaseNew($message);
                                                }
                                            } else {
                                                $this->messageCaseNew($message);
                                            }
                                            // $msg = [
                                            //     'content' => $message['text'],
                                            //     'contentType' => 'text'
                                            // ];
                                            // $this->facebookMessageService->storeMessage($sender_id,999,$msg,$customer);
                                            // $msg = ['content' => 'BOT 🤖 : สวัสดีครับ','contentType' => 'text'];
                                            // $req = $this->facebookMessageService->sendMessage($fb_page_id,$access_token,$msg, $sender_id);
                                            // $this->facebookMessageService->storeMessage($sender_id,999,$msg,$BOT);
                                            // if ($req['status']) {
                                            //     Log::channel('facebook_webhook_log')->info($req['message']);
                                            // } else throw new \Exception($req['message']);
                                        } else throw new \Exception('ไม่มีข้อมูล message');
                                    } else throw new \Exception($customer['message'] ?? 'ไม่สามารถดึงหรือสร้าง');
                                } else throw new \Exception('ไม่มีข้อมูล sender');
                            }
                        } else throw new \Exception('ไม่มีข้อมูล messaging');
                    }
                } else throw new \Exception('ไม่มีข้อมูล entry');
            } else throw new \Exception('Object ไม่ใช่ page');
            return response('EVENT_RECEIVED', 200);
        } catch (\Exception $e) {
            Log::channel('facebook_webhook_log')->error('Facebook POST webhook error: ' . $e->getMessage());
            return response('EVENT_RECEIVED', 200);
        }
    }

    private function messageCasePending($current_rate = null) {
        Log::channel('facebook_webhook_log')->info('Facebook webhook : เคสปัจจุบันอยู่ในสถานะ Pending');
    }

    private function messageCaseProgress($current_rate = null) {
        Log::channel('facebook_webhook_log')->info('Facebook webhook : เคสอยู่ในสถานะ Progress');
    }

    private function messageCaseSuccess($current_rate = null) {
        Log::channel('facebook_webhook_log')->info('Facebook webhook : เคสปัจจุบันอยู่ในสถานะ Success');
    }

    private function messageCaseNew($message = null) {
        Log::channel('facebook_webhook_log')->info('Facebook webhook : เคสปัจจุบันอไม่มีอยู่ หรือเป็นเคสใหม่');
    }

    private function checkKeyword($content) {}


    public function webhook(Request $request)
    {
        Log::channel('facebook_webhook_log')->info('>>> Facebook GET webhook verify called');
        Log::channel('facebook_webhook_log')->info($request->query());

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
