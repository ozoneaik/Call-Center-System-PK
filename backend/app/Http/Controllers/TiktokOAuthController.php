<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TiktokOAuthController extends Controller
{
    public function callback(Request $request)
    {
        $code = $request->query('code');
        $state = $request->query('state');

        if (!$code) {
            return response('Missing code parameter', 400);
        }

        $clientKey = env('TIKTOK_CLIENT_KEY');
        $clientSecret = env('TIKTOK_CLIENT_SECRET');
        $redirectUri = env('TIKTOK_REDIRECT_URI');

        try {
            $response = Http::post('https://open-api.tiktokglobalshop.com/oauth2/token', [
                'client_key' => $clientKey,
                'client_secret' => $clientSecret,
                'code' => $code,
                'grant_type' => 'authorization_code',
                'redirect_uri' => $redirectUri,
            ]);

            $body = $response->json();

            Log::info('🎟️ TikTok OAuth Token Response:', $body);

            if ($response->successful()) {
                $accessToken = $body['data']['access_token'] ?? null;
                $refreshToken = $body['data']['refresh_token'] ?? null;
                $expiresIn = $body['data']['expires_in'] ?? null;

                // ✅ คุณสามารถบันทึก access token ลง DB หรือ .env
                return response()->json([
                    'access_token' => $accessToken,
                    'refresh_token' => $refreshToken,
                    'expires_in' => $expiresIn,
                ]);
            } else {
                return response()->json(['error' => $body], 400);
            }
        } catch (\Exception $e) {
            Log::error('❌ TikTok OAuth Error: ' . $e->getMessage());
            return response()->json(['error' => 'OAuth Exception'], 500);
        }
    }
}
