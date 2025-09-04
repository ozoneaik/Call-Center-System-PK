<?php

namespace App\Services;

use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MessageService
{
    // หาผลรวมของเวลาสนทนา
    public function differentTime($S, $T): string
    {
        try {
            $startTime = Carbon::parse($S);
            $endTime = Carbon::parse($T);
            $diffInSeconds = $startTime->diffInSeconds($endTime);
            $hours = floor($diffInSeconds / 3600);
            $minutes = floor(($diffInSeconds % 3600) / 60);
            $seconds = $diffInSeconds % 60;
            return "{$hours} ชั่วโมง {$minutes} นาที {$seconds} วินาที";
        } catch (\Exception $e) {
            return "เกิดข้อผิดพลาดในการคำนวน";
        }
    }

    // ส่งข้อความจากพนักงาน
    public function sendMsgByLine($custId, $messages): array
    {
        try {
            $data['status'] = false;
            switch ($messages['contentType']) {
                case 'text':
                    $msg['type'] = 'text';
                    $msg['text'] = $messages['content'];
                    if (isset($messages['line_quote_token'])) {
                        $msg['quoteToken'] = $messages['line_quote_token'];
                    }
                    break;
                case 'image':
                    $msg['type'] = 'image';
                    $msg['originalContentUrl'] = $messages['content'];
                    $msg['previewImageUrl'] = $messages['content'];
                    break;
                case 'sticker':
                    $msg['type'] = 'image';
                    $msg['originalContentUrl'] = $messages['content'];
                    $msg['previewImageUrl'] = $messages['content'];
                    break;
                case 'video':
                    $msg['type'] = 'video';
                    $msg['originalContentUrl'] = $messages['content'];
                    $msg['previewImageUrl'] = $messages['content'];
                    break;
                case 'file':
                    $msg = [
                        'type' => 'template',
                        'altText' => 'This is a buttons template',
                        'template' => [
                            'type' => 'buttons', // กำหนด type ให้เป็น 'buttons' ตรงนี้จำเป็นสำหรับ LINE API
                            'thumbnailImageUrl' => "https://images.pumpkin.tools/icon/pdf_icon.png",
                            'imageAspectRatio' => "rectangle",
                            'imageSize' => "cover",
                            'text' => "ไฟล์.pdf", // title ไม่จำเป็นต้องใช้ใน template buttons
                            'actions' => [
                                [
                                    'type' => "uri",
                                    'label' => "ดูไฟล์",
                                    'uri' => $messages['content'] ?? 'https://example.com/default.pdf' // แก้ให้รองรับกรณี $messages['content'] ไม่มีค่า
                                ]
                            ]
                        ]
                    ];
                    break;
                default:
                    throw new \Exception('ไม่สามารถส่งข้อความได้เนื่องจากไม่รู้จัก type [MessageService sendMsgByLine]');
            }
            $token = Customers::query()->leftJoin('platform_access_tokens as PAT', 'customers.platformRef', '=', 'PAT.id')
                ->where('custId', 'LIKE', $custId)
                ->select('PAT.accessToken')
                ->get();
            $accessToken = $token[0]->accessToken;
            $URL = 'https://api.line.me/v2/bot/message/push';
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken
            ])->asJson()->post($URL, [
                'to' => $custId,
                'messages' => [$msg]
            ]);
            if ($response->status() == 200) {
                $data['status'] = true;
                $responseJson = $response->json();
                $responseJson = $responseJson['sentMessages'][0];
                $data['responseJson'] = $responseJson;
            } else {
                $data['status'] = false;
                $resJson = $response->json();
                $messageError = 'Line API PUSH MESSAGE => ' . $resJson['details'][0]['message'] ?? 'ส่งข้อความไม่สำเร็จ ติดต่อผู้ดูแลระบบเพื่อเช็ค Line API';
                throw new \Exception($messageError);
            }
            $data['message'] = $response->json() ?? 'test';
            Log::info('ERROR METHOD MESSAGE SERVICE >>> sendMsgByLine');
            Log::info($response->json());
        } catch (\Exception $e) {
            $data['status'] = false;
            Log::error($e->getMessage());
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function MsgEndTalk($custId, $rateId): array
    {

        try {
            $URL = 'https://api.line.me/v2/bot/message/push';
            $URL_RATING = env('APP_WEBHOOK_URL') . "/$custId/$rateId";
            $token = Customers::query()->leftJoin('platform_access_tokens as PAT', 'customers.platformRef', '=', 'PAT.id')
                ->where('custId', 'LIKE', $custId)
                ->select('PAT.accessToken')
                ->get();
            $accessToken = $token[0]->accessToken;

            $body = [
                "to" => $custId,
                "messages" => [
                    [
                        "type" => "text",
                        "text" => "เพื่อให้เราสามารถพัฒนาการบริการได้ดียิ่งขึ้น เราขอเชิญคุณช่วยประเมินประสบการณ์การแชทครั้งนี้ด้วยนะครับ/ค่ะ 🙏",
                        "quickReply" => [
                            "items" => [
                                [
                                    "type" => "action",
                                    "action" => [
                                        "type" => "postback",
                                        "label" => "👍 ถูกใจ",
                                        "data" => "like,$rateId",
                                        "displayText" => "ถูกใจ"
                                    ]
                                ],
                                [
                                    "type" => "action",
                                    "action" => [
                                        "type" => "postback",
                                        "label" => "👎 ไม่ถูกใจ",
                                        "data" => "dislike,$rateId",
                                        "displayText" => "ไม่ถูกใจ"
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ];

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken
            ])->asJson()->post($URL, $body);
            if ($response->status() == 200) {
                $data['status'] = true;
                $data['message'] = 'ส่งประเมินสำเร็จ';
            } else {
                $message = $response->json();
                $message = collect($message)->get('details.0.message', 'ส่งข้อความไม่สำเร็จ ติดต่อผู้ดูแลระบบเพื่อเช็ค Line API');
                throw new \Exception('Line API รายละเอียด >>> ' . $message);
            }
        } catch (\Exception $e) {
            Log::channel('line_webhook_log')->error($e->getMessage());
            Log::channel('line_webhook_log')->error($e->getLine() . ' ' . $e->getFile());
            $data['status'] = false;
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function quickReplyMsgLine($rate, $replyToken)
    {
        $customer = Customers::query()->where('custId', $rate->custId)->first();
        $token = PlatformAccessTokens::query()->where('id', $customer->platformRef)->first();
        $accessToken = $token->accessToken;
        $URL = ''.env('FRONTEND_URL').'/feedback/'.$customer->custId.'/'.$rate->id;
        Log::error($URL);
        $message = [
            'replyToken' => $replyToken,
            'messages' => [[
                'type' => 'flex',
                'altText' => 'Quick Reply',
                'contents' => [
                    'type' => 'bubble',
                    'body' => [
                        'type' => 'box',
                        'layout' => 'vertical',
                        'spacing' => 'md',
                        'contents' => [
                            [
                                'type' => 'text',
                                'text' => 'บจก. พัมคิน คอร์ปอเรชั่น',
                                'weight' => 'bold',
                                'size' => 'lg',
                            ],
                            [
                                'type' => 'text',
                                'text' => 'ขอความร่วมมือในการแสดงความคิดเห็นเพื่อนำไปปรับปรุงบริการของเรา',
                                'color' => '#FF9826FF',
                                'wrap' => true,
                            ]
                        ]
                    ],
                    'footer' => [
                        'type' => 'box',
                        'layout' => 'vertical',
                        'contents' => [
                            ['type' => 'spacer'],
                            [
                                'type' => 'button',
                                'action' => [
                                    'type' => 'uri',
                                    'label' => '📄กรอกใบประเมิน',
                                    'uri' => $URL,
                                ],
                                'color' => '#F15823FF',
                                'style' => 'primary'
                            ]
                        ]
                    ]
                ]
            ]]
        ];
        try {
            $response = Http::withHeaders(['Authorization' => 'Bearer ' . $accessToken])
                ->post('https://api.line.me/v2/bot/message/reply', $message);
            if ($response->status() == 200) {
                $responssJson = $response->json();
                Log::error('Line Success ✅✅');
            } else {
                $responssJson = $response->json();
                Log::error('Line Error ❌❌', [
                    'error' => $responssJson,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('LineAiController', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
