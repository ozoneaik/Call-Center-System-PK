<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TokenService
{
    public function checkVerifyToken($token): array
    {
        $data['status'] = false;
        $data['message'] = 'ไม่พบข้อผิดพลาด';
        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/x-www-form-urlencoded',
            ])->asForm()->post('https://api.line.me/v2/oauth/revoke', ['access_token' => $token]);
            if ($response->status() == 200) {
                $data['status'] = true;
            } else {
                Log::error('เกิดข้อผิดพลาดในการ check token verify');
                Log::info($response->json());
                throw new \Exception("ตรวจสอบล้มเหลว");
            }
        } catch (\Exception $e) {
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }
}
