<?php

namespace App\Http\Controllers\webhooks;

use App\Http\Controllers\Controller;
use App\Models\TiktokToken;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TiktokTokenController extends Controller
{
    private $appKey;
    private $appSecret;

    public function __construct()
    {
        $this->appKey = config('services.tiktok.app_key');
        $this->appSecret = config('services.tiktok.app_secret');
    }

    public function getAccessToken(Request $request)
    {
        $authCode = $request->query('code');
        if (!$authCode) {
            return response()->json(['error' => 'Missing authorization code from TikTok callback'], 400);
        }

        $baseUrl = 'https://auth.tiktok-shops.com';
        $endpoint = '/api/v2/token/get';

        $params = [
            'app_key'    => $this->appKey,
            'app_secret' => $this->appSecret,
            'auth_code'  => $authCode,
            'grant_type' => 'authorized_code',
        ];

        $response = Http::get($baseUrl . $endpoint, $params);
        $json = $response->json();
        Log::channel('tiktok_token_log')->info("📦 TikTok Token Raw Response:\n" . json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        if ($response->failed()) {
            return response()->json([
                'error' => 'Failed to get access token from TikTok',
                'status' => $response->status(),
                'body' => $response->json() ?? $response->body(),
            ], $response->status());
        }

        $data = $response->json()['data'] ?? [];

        TiktokToken::updateOrCreate(
            ['open_id' => $data['open_id']],
            [
                'seller_name' => $data['seller_name'],
                'access_token' => $data['access_token'],
                'access_token_expire_at' => Carbon::createFromTimestamp($data['access_token_expire_in']),
                'refresh_token' => $data['refresh_token'],
                'refresh_token_expire_at' => Carbon::createFromTimestamp($data['refresh_token_expire_in']),
                'seller_base_region' => $data['seller_base_region'] ?? null,
                'granted_scopes' => $data['granted_scopes'] ?? [],
            ]
        );

        return response()->json(['message' => 'Access token stored successfully.']);
    }

    public function refreshAccessToken($openId)
    {
        $token = TiktokToken::where('open_id', $openId)->first();

        if (!$token) {
            return response()->json(['error' => 'No token found for this Open ID'], 404);
        }

        $baseUrl = 'https://auth.tiktok-shops.com';
        $endpoint = '/api/v2/token/refresh';

        $params = [
            'app_key'       => $this->appKey,
            'app_secret'    => $this->appSecret,
            'refresh_token' => $token->refresh_token,
            'grant_type'    => 'refresh_token',
        ];

        $response = Http::get($baseUrl . $endpoint, $params);

        Log::channel('tiktok_token_log')->info("🔁 TikTok Refresh Token Response:\n" . json_encode(
            $response->json(),
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
        ));

        if ($response->failed()) {
            return response()->json([
                'error' => 'Failed to refresh token',
                'body' => $response->json(),
            ], $response->status());
        }

        $data = $response->json()['data'];

        $token->update([
            'access_token' => $data['access_token'],
            'access_token_expire_at' => \Carbon\Carbon::createFromTimestamp($data['access_token_expire_in']),
            'refresh_token' => $data['refresh_token'],
            'refresh_token_expire_at' => \Carbon\Carbon::createFromTimestamp($data['refresh_token_expire_in']),
        ]);

        return response()->json(['message' => 'Access token refreshed successfully']);
    }
}
