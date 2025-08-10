<?php

namespace App\Services\webhooks_new;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ReplyMessage
{
    public function reply($message, $platformAccessToken, $cutomer, $bot, $reply_token = null)
    {
        switch (strtoupper($platformAccessToken['platform'])) {
            case 'LINE':
                Log::channel('webhook_main')->info('กำลังส่งข้อความตอบกลับผ่าน LINE');
                return $this->replyByLine($message, $platformAccessToken, $bot, $reply_token);
                break;

            case 'FACEBOOK':
                Log::channel('webhook_main')->info('กำลังส่งข้อความตอบกลับผ่าน FACEBOOK');
                return $this->replyByFacebook($message, $platformAccessToken, $cutomer, $bot, $reply_token);
                break;
            default:
                Log::channel('webhook_main')->info('กำลังส่งข้อความตอบกลับผ่าน แพลตฟอร์มอื่น');
                break;
        }
    }

    private function replyByLine($message, $platformAccessToken, $bot, $reply_token)
    {
        try {
            $uri = 'https://api.line.me/v2/bot/message/reply';
            $headers = 'Bearer ' . $platformAccessToken['accessToken'];
            $data = [
                'replyToken' => $reply_token,
                'messages' => $message
            ];
            $response = Http::withHeader('Authorization', $headers)->post($uri, $data);
            if ($response->successful()) {
                Log::channel('webhook_main')->info('ส่งส่งข้อความสำเร็จ', [
                    'reply_token' => $reply_token,
                    'messages' => $message
                ]);
                return [
                    'status' => true,
                    'response' => $response->json(),
                ];
            } else {
                throw new \Exception('ไม่สามารถส่งข้อความได้: ' . $response->body());
            }
        } catch (\Exception $e) {
            return [
                'status' => false,
                'message' => 'ไม่สามารถส่งข้อความได้: ' . $e->getMessage(),
                'error' => $e->getMessage() . ' ' . $e->getLine() . ' ' . $e->getFile()
            ];
        }
    }

    private function replyByFacebook($message, $platformAccessToken, $customer, $bot, $reply_token)
    {
        $fb_api_version = env('FACEBOOK_VERSION', 'v23.0');
        $mssage_format = ['text' => $message[0]['content']];
        $endpoint = $fb_api_version . '/' . $platformAccessToken['fb_page_id'] . '/messages';
        try {
            $body = [
                'access_token' => $platformAccessToken['accessToken'],
                'recipient' => [
                    'id' => $customer['custId'],
                ],
                'messaging_type' => 'RESPONSE',
                "message" => $mssage_format
            ];
            $uri = 'https://graph.facebook.com/' . $endpoint;
            $response = Http::post($uri, $body);
            if ($response->successful() && $response->status() === 200) {
                Log::channel('webhook_main')->info('ส่งส่งข้อความสำเร็จ', [
                    'reply_token' => $reply_token,
                    'messages' => $message
                ]);
                return [
                    'status' => true,
                    'response' => $response->json(),
                ];
            } else {
                throw new \Exception('ไม่สามารถส่งข้อความได้: ' . $response->body());
            }
            return [
                'status' => true,
                'message' => ['message' => 'sucess']
            ];
        } catch (\Exception $e) {
            return [
                'status' => false,
                'message' => 'ไม่สามารถส่งข้อความได้: ' . $e->getMessage(),
            ];
        }
    }
}
