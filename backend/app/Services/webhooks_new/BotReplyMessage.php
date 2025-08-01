<?php

namespace App\Services\webhooks_new;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;


class BotReplyMessage{
    public function replyMessage($message, $platformAccessToken, $customer,$reply_token)
    {
        $msg_format = [];
        switch(strtoupper($platformAccessToken['platform'])){
            case 'LINE' : {
                foreach ($message as $key => $msg) {
                    $msg_format[$key]['text'] = $msg['content'];
                    $msg_format[$key]['type'] = $msg['contentType'];
                }
                return $this->replyMessageByLine($msg_format, $platformAccessToken, $customer,$reply_token);
                break;
            }default : {

            }
        }   
    }

    public function replyMessageByLine($message, $platformAccessToken, $customer,$reply_token){
        try{
            $res = Http::withHeader('Authorization', 'Bearer ' . $platformAccessToken['accessToken'])
                ->post('https://api.line.me/v2/bot/message/reply', [
                    'replyToken' => $reply_token,
                    'messages' => $message
                ]);
            if($res->successful() && $res->status() === 200){
                return [
                    'status' => true,
                    'message' => 'bot ส่งข้อความไปว่า ระบบกำลังส่งต่อให้เข้าหน้าที่ กรุณารอซักครู่ สำเร็จ',
                ];
            }else{
                throw new \Exception('Failed to reply message on LINE: ' . $res->body());
            }
        }catch(\Exception $e){
            return [
                'status' => false,
                'message' => 'bot ไม่สามารถส่งข้อความไปว่า ระบบกำลังส่งต่อให้เข้าหน้าที่ กรุณารอซักครู่ สำเร็จ',
                'error' => $e->getMessage(). ' ' . $e->getLine() . ' ' . $e->getFile()
            ];
        }
    }
}