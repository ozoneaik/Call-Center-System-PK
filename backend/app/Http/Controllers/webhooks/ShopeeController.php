<?php

namespace App\Http\Controllers\webhooks;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ShopeeController extends Controller
{
    public function webhook(Request $request)
    {
        Log::channel('shopee_webhook_log')->info('--- Get Test Push Received ---');
        Log::channel('shopee_webhook_log')->info('All Headers:', $request->headers->all());

        $shopeeSignature = $request->header('Authorization');
        $partnerKey = env('SHOPEE_PARTNER_KEY');
        $requestBody = $request->getContent();
        $callbackUrl = $request->getSchemeAndHttpHost() . $request->getPathInfo();
        
        Log::channel('shopee_webhook_log')->info('Callback URL: ' . $callbackUrl);

        $baseString = $callbackUrl . $requestBody;
        
        $calculatedSignature = hash_hmac('sha256', $baseString, $partnerKey);

        Log::channel('shopee_webhook_log')->info('Shopee Signature: ' . $shopeeSignature);
        Log::channel('shopee_webhook_log')->info('Base String: ' . $baseString);
        Log::channel('shopee_webhook_log')->info('Calculated Signature: ' . $calculatedSignature);

        if (hash_equals($calculatedSignature, $shopeeSignature)) {
            Log::channel('shopee_webhook_log')->info('SUCCESS: Signature Matched!');
            
            return response('OK', 200)
                  ->header('Content-Type', 'text/plain')
                  ->header('Authorization', $calculatedSignature); 
        }

        Log::channel('shopee_webhook_log')->error('ERROR: Signature Mismatch!');
        return response()->json(['error' => 'Invalid signature'], 403);
    }
}