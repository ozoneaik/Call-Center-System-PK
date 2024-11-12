<?php

namespace App\Services;

use App\Models\Customers;
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
                    break;
                case 'image' :
                    $msg['type'] = 'image';
                    $msg['originalContentUrl'] = $messages['content'];
                    $msg['previewImageUrl'] = $messages['content'];
                    break;
                case 'sticker' :
                    $msg['type'] = 'sticker';
                    $msg['packageId'] = '446';
                    $msg['stickerId'] = '1988';
                    break;
                default :
                    throw new \Exception('ไม่สามารถส่งข้อความได้เนื่องจากไม่รู้จัก type');
            }
            $token = Customers::leftJoin('platform_access_tokens as PAT', 'customers.platformRef', '=', 'PAT.id')
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
            } else {
                $data['status'] = false;
                throw new \Exception($response->json());
            }
            $data['message'] = $response->json() ?? 'test';
            Log::info('ERROR METHOD MESSAGE SERVICE >>> sendMsgByLine');
            Log::info($response->json());
        } catch (\Exception $e) {
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
            $token = Customers::leftJoin('platform_access_tokens as PAT', 'customers.platformRef', '=', 'PAT.id')
                ->where('custId', 'LIKE', $custId)
                ->select('PAT.accessToken')
                ->get();
            $accessToken = $token[0]->accessToken;

            $body = [
                "to" => $custId,
                "messages" => [
                    [
                        "type" => "flex",
                        "altText" => "this is a flex message",
                        "contents" => [
                            "type" => "bubble",
                            "body" => [
                                "type" => "box",
                                "layout" => "vertical",
                                "contents" => [
                                    [
                                        "type" => "text",
                                        "text" => "ขอบคุณที่ใช้บริการแชทของเรา! 🙏",
                                        "weight" => "bold",
                                        "size" => "lg",
                                        "wrap" => true,
                                        "color" => "#eb5622"
                                    ],
                                    [
                                        "type" => "text",
                                        "text" => "เพื่อให้เราสามารถพัฒนาการบริการได้ดียิ่งขึ้น เราขอเชิญคุณช่วยประเมินประสบการณ์การแชทครั้งนี้โดยคลิกที่ลิงก์ด้านล่างค่ะ/ครับ",
                                        "wrap" => true,
                                        "size" => "md",
                                        "color" => "#666666",
                                        "margin" => "md"
                                    ],
                                    [
                                        "type" => "separator",
                                        "margin" => "lg"
                                    ],
                                    [
                                        "type" => "button",
                                        "action" => [
                                            "type" => "uri",
                                            "label" => "คลิกที่นี่เพื่อประเมิน",
                                            "uri" => $URL_RATING
                                        ],
                                        "style" => "primary",
                                        "color" => "#eb5622",
                                        "margin" => "lg",
                                        "height" => "sm"
                                    ],
                                    [
                                        "type" => "text",
                                        "text" => "ขอบคุณสำหรับความคิดเห็นของคุณ 😊",
                                        "size" => "sm",
                                        "color" => "#999999",
                                        "wrap" => true,
                                        "margin" => "lg",
                                        "align" => "center"
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
                $message = $message['details'][0]['message'];
                throw new \Exception('Line API รายละเอียด >>> '.$message);
            }
        } catch (\Exception $e) {
            $data['status'] = false;
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

}
