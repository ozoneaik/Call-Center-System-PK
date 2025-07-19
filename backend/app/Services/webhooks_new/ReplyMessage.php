<?php

namespace App\Services\webhooks_new;
class ReplyMessage{
    public function reply($message, $platformAccessToken,$cutomer, $bot,$reply_token = null)
    {
        switch (strtoupper($platformAccessToken['platform'])) {
            case 'LINE':
                $this->replyByLine($message, $platformAccessToken, $bot,$reply_token);
                break;
            default:
                # code...
                break;
        }
    }

    private function replyByLine($message, $platformAccessToken, $bot,$reply_token)
    {
        
    }
}