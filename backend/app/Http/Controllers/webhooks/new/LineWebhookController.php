<?php

namespace App\Http\Controllers\webhooks\new;

use App\Http\Controllers\Controller;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LineWebhookController extends Controller
{
    protected $start_log_line = '-----------------------------เริ่มรับ webhook-----------------------------';
    protected $end_log_line = '-----------------------------สิ้นสุดรับ webhook-----------------------------';
    public function webhook(Request $request)
    {
        Log::channel('webhook_line_new')->info($this->start_log_line); //เริ่มรับ webhook
        $req = $request->all();
        Log::channel('webhook_line_new')->info(json_encode($req, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        $events = $req['events'];
        foreach ($events as $key => $event) {
            if ($event['type'] === 'message') {
                Log::channel('webhook_line_new')->info('event index = ' . $key . 'เป็น message 💬');
            } else {
                Log::channel('webhook_line_new')->info('event index = ' . $key . 'ไม่ใช่ประเภท message');
            }
        }

        Log::channel('webhook_line_new')->info($this->end_log_line); //สิ้นสุดรับ webhook
        return response()->json([
            'message' => 'ตอบกลับ webhook สําเร็จ',
        ]);
    }

    private function checkCustomer($custId)
    {
        $check_customer = Customers::query()->where('custId', $custId)->first()->toArray();
        if ($check_customer) {
            $platform = PlatformAccessTokens::query()->where('platform', 'line')
                ->where('id', $check_customer['platformRef'])->first()->toArray();
            return [
                'customer' => $check_customer,
                'platform' => $platform
            ];
        }else{
            $platform_list = PlatformAccessTokens::query()->where('platform', 'line')->get()->toArray();
            foreach ($platform_list as $key => $token) {
                
            }
        }
    }
}
