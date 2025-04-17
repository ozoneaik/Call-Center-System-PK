<?php

namespace App\Services\webhooks;

use App\Models\BotMenu;
use App\Models\ChatHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LineMessageService
{
    public function storeMessage($customer, $sender, $message, $acId, $token)
    {

        Log::channel('line_webhook_log')->info('acId ==> '.$acId);
        Log::channel('line_webhook_log')->info(gettype($sender));
        switch ($message['type']) {
            case 'text':
                $content = $message['text'];
                break;
            case 'image':
                $imageId = $message['id'];
                $content = $this->storeMedia($imageId, $token);
                break;
            case 'sticker' :
                $stickerId = $message['stickerId'];
                $pathStart = 'https://stickershop.line-scdn.net/stickershop/v1/sticker/';
                $pathEnd = '/iPhone/sticker.png';
                $newPath = $pathStart . $stickerId . $pathEnd;
                $content = $newPath;
                break;
            case 'video' :
                $videoId = $message['id'];
                $content = $this->storeMedia($videoId, $token);
                break;
            case 'location':
                $lat = $message['latitude'];
                $long = $message['longitude'];
                $locationLink = 'พิกัดแผนที่ => https://www.google.com/maps?q=' . $lat . ',' . $long;
                $content = $message['address'] . '🗺️' . $locationLink;
                break;
            case 'audio':
                $audioId = $message['id'];
                $content = $this->storeMedia($audioId, $token);
                break;
            case 'file':
                $fileId = $message['id'];
                $content = $this->storeMedia($fileId, $token);
                break;
            default :
                $content = 'ไม่สามารถตรวจสอบได้ว่าลูกค้าส่งอะไรเข้ามา';
        }
        return ChatHistory::query()->create([
            'custId' => $customer['custId'],
            'content' => $content,
            'contentType' => $message['type'],
            'sender' => json_encode($sender),
            'conversationRef' => $acId,
            'line_quoteToken' => $message['quoteToken'] ?? null
        ]);
    }

    private function storeMedia($mediaId, $token): string
    {
        try {
            $url = "https://api-data.line.me/v2/bot/message/$mediaId/content";
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $token,
            ])->get($url);
            if ($response->status() == 200) {
                return 'ส่งรูปภาพ ไฟล์ วิดีโอ เสียง หรือ อื่นๆ';
            } else throw new \Exception("Error Processing Request");
        } catch (\Exception $e) {
            return 'ตรวจสอบไม่ได้ว่าเป็นรูปภาพ ไฟล์ วิดีโอ เสียง หรือ อื่นๆ';
        }
    }

    public function sendMenu($sender, $token)
    {
        try {
            Log::channel('line_webhook_log')->info('ส่งเมนู');
            $bot_menus = BotMenu::query()
                ->leftJoin('platform_access_tokens', 'bot_menus.botTokenId', '=', 'platform_access_tokens.id')
                ->leftJoin('customers', 'platform_access_tokens.id', '=', 'customers.platformRef')
                ->where('customers.custId', $sender['custId'])
                ->get();
            $actions = [];
            if (count($bot_menus) > 0) {
                foreach ($bot_menus as $botMenu) {
                    $actions[] = [
                        'type' => 'message',
                        'text' => $botMenu->menuName,
                        'label' => $botMenu->menuName,
                    ];
                }
            } else {
                $actions[] = [
                    'type' => 'message',
                    'text' => 'อื่นๆ',
                    'label' => 'อื่นๆ'
                ];
            }
            $body = [
                "to" => $sender['custId'],
                'messages' => [
                    [
                        'type' => 'text',
                        'text' => "สวัสดีคุณ " . $sender['custName'] . " เพื่อให้การบริการที่รวดเร็ว กรุณาเลือกหัวด้านล่างเพื่อส่งต่อให้เจ้าหน้าที่เพื่อมาบริการท่านต่อไป  ขอบคุณครับ/ค่ะ",
                    ],
                    [
                        'type' => 'template',
                        'altText' => 'this is a buttons template',
                        'template' => [
                            'type' => 'buttons',
                            'title' => 'ยินดีต้อนรับ! 🙏',
                            'text' => 'กรุณาเลือกเมนูที่ท่านต้องการสอบถาม',
                            'actions' => $actions
                        ]
                    ]
                ]
            ];
            $this->pushMessage($body, $token);
        }catch (\Exception $e) {
            Log::channel('line_webhook_log')->error($e->getMessage());
        }


    }

    public function pushMessage($body, $token): array
    {
        $data = [];
        try {
            Log::channel('line_webhook_log')->info('เตรียมส่งไปยัง line');
            Log::channel('line_webhook_log')->info('Token: ' . $token);
            $UrlPush = 'https://api.line.me/v2/bot/message/push';
            $res = Http::withHeaders([
                'Authorization' => 'Bearer ' . $token['accessToken']
            ])->asJson()->post($UrlPush, $body);
            $data['status'] = true;
            $data['message'] = 'successful';
            $res = $res->json();
            Log::channel('line_webhook_log')->info('ส่งได้');
            Log::channel('line_webhook_log')->info($res);
            return $data;
        } catch (\Exception $e) {
            Log::channel('line_webhook_log')->info('ส่งไม่ได้');
            $data['status'] = false;
            $data['message'] = $e->getMessage();
            return $data;
        }
    }
}
