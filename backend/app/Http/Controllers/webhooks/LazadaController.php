<?php

namespace App\Http\Controllers\webhooks;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LazadaController extends Controller
{
    public function webhook(Request $request)
    {
        try {

            Log::info('Lazada Webhook Received', [
                'headers' => $request->headers->all(),
                'body' => $request->all(),
            ]);

            $url = 'https://api.lazada.co.th/rest/im/message/send';

            $queryParams = [
                'txt' => 'ข้อความ SSSS',
                'img_url' => 'https://sg-live-02.slatic.net/p/0dc6fb4898f7e991bf44c45471dca9c9.jpg',
                'item_id' => '1762013406',
                'width' => '100',
                'session_id' => '100158264242_1_100210272547_2_103',
                'template_id' => '1',
                'promotion_id' => '91471122422003',
                'order_id' => '1762013406',
                'height' => '100',
                'video_id' => '3678332',
                'app_key' => '132189',
                'sign_method' => 'sha256',
                'access_token' => '50000701d13ulrbccp4KuVdnE153386b3PGvksWHlWGQphOsVwumZ2fpEj5W0Fwy',
                'timestamp' => '1751518230574',
                'sign' => '698E84C5D67F8186321126BA605C1EF694B7672BF0FBF7CD87B2CB01761BCE3B',
            ];

            $response = Http::withOptions([
                'allow_redirects' => true,
            ])->post($url, $queryParams);

            if ($response->successful()) {
                Log::info('Lazada response:', $response->json());
                return response('OK',200);
            } else {
                Log::error('Lazada error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return response('OK',200);
            }
        } catch (\Exception $e) {
            Log::error('Error in Lazada Webhook', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ]);
            return response('OK',200);
        }
    }
}
