<?php

namespace App\Services\webhooks_new;

use LINE\Clients\MessagingApi\Configuration;
use LINE\Clients\MessagingApi\Api\MessagingApiApi;
use LINE\Clients\MessagingApi\Model\PushMessageRequest;
use LINE\Clients\MessagingApi\Model\TextMessage;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log; 

class SendMessage
{
    public function sendMessage($message, $platFrom, $token,$customer)
    {
        switch ($platFrom) {
            case 'line':
                $this->sendMsgByLine($message, $token,$customer,$customer);
                break;
            case 'facebook':
                $this->sendMsgByFacebook($message, $token);
                break;
            case 'lazada':
                $this->sendMsgByLaza($message, $token);
                break;
            case 'shopee':
                $this->sendMsgByShopee($message, $token);
                break;
            default:
                break;
        }
        $this->storeMessage($message, $token);
    }




    private function storeMessage($message = null, $accessToken = null, $custId = null) {}

    private function sendMsgByLine($message = null, $accessToken = null, $customer = null)
    {
        $client = new Client();
        $config = new Configuration();
        $config->setAccessToken($accessToken);
        $messagingApi = new MessagingApiApi($client, $config);
        $msg_format = [];
        switch ($message['contentType']) {
            case 'text':
                $msg_format['type'] = 'text';
                $msg_format['text'] = $message['content'];
                break;
            case 'image':
                $msg_format['type'] = 'image';
                $msg_format['originalContentUrl'] = $message['content'];
                $msg_format['previewImageUrl'] = $message['content'];
                break;
            case 'video':
                $msg_format['type'] = 'video';
                $msg_format['originalContentUrl'] = $message['content'];
                $msg_format['previewImageUrl'] = $message['content'];
                break;
            case 'audio':
                $msg_format['type'] = 'audio';
                $msg_format['originalContentUrl'] = $message['content'];
                $msg_format['previewImageUrl'] = $message['content'];
                break;
            case 'file':
                $msg_format['type'] = 'file';
                $msg_format['originalContentUrl'] = $message['content'];
                $msg_format['previewImageUrl'] = $message['content'];
                break;
            case 'sticker':
                $msg_format['type'] = 'file';
                $msg_format['originalContentUrl'] = $message['content'];
                $msg_format['previewImageUrl'] = $message['content'];
                break;
            default:
                $msg_format['type'] = 'text';
                $msg_format['text'] = 'ขณะนี้เกิดปัญหากับ Line ไม่สามารถส่งข้อความได้';
        }
        $message_body = new TextMessage($msg_format);

        $request_line = new PushMessageRequest([
            'to' => $customer['custId'],
            'messages' => [$message_body],
        ]);
        $res_send_message = $messagingApi->pushMessage($request_line);
        Log::channel('webhook_line')->info(json_encode($res_send_message, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    private function sendMsgByFacebook($message = null, $accessToken = null, $custId = null) {}

    private function sendMsgByLaza($message = null, $accessToken = null, $custId = null) {}

    private function sendMsgByShopee($message = null, $accessToken = null, $custId = null) {}
}
