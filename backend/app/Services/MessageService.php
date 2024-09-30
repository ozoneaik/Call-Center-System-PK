<?php

namespace App\Services;

use App\Models\Customers;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;

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
                    $msg['originalContentUrl'] = 'https://gratisography.com/wp-content/uploads/2024/03/gratisography-funflower-800x525.jpg';
                    $msg['previewImageUrl'] = 'https://gratisography.com/wp-content/uploads/2024/03/gratisography-funflower-800x525.jpg';
                    break;
                case 'sticker' :
                    $msg['type'] = 'sticker';
                    $msg['packageId'] = '446';
                    $msg['stickerId'] = '1988';
                    break;
                default :
                    throw new \Exception('ไม่สามารถส่งข้อความได้เนื่องจากไม่รู้จัก type');
            }
            $token = Customers::leftJoin('platform_access_tokens as PAT', 'customers.platformRef', '=', 'PAT.accessTokenId')
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
            } else throw new \Exception($response->json());
            $data['messages'] = $response->json();
        } catch (\Exception $e) {
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    // ดึงรายการแชท
}
