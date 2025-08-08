<?php

namespace App\Services\webhooks_new;

use App\Models\Keyword;
use Illuminate\Support\Facades\Log;


class CheckKeyword
{
    protected $MESSAGE;
    public function check($message = [])
    {
        Log::channel('webhook_main')->info('เริ่มการกรอง keyword');
        $this->MESSAGE = $message;
        $msg_return = ['status' => false, 'message' => 'ไม่ตรงใน keyword', 'redirectTo' => null];

        if ($this->MESSAGE['contentType'] === 'text') {
            $allKeywords = Keyword::all(); // ดึง keyword ทั้งหมด

            $foundKeyword = $allKeywords->first(function ($k) {
                return str_contains($this->MESSAGE['content'], $k->name);
            });

            if ($foundKeyword) {
                if (!$foundKeyword['event']) {
                    $msg_return['status'] = true;
                     $msg_return['redirectTo'] = true;
                    $msg_return['message'] = 'เจอ keyword ที่ไม่เป็นของจบสนทนา';
                    $msg_return['redirectTo'] = $foundKeyword['redirectTo'];
                } else {
                    $msg_return['status'] = true;
                    $msg_return['redirectTo'] = false;
                    $msg_return['message'] = 'เจอ keyword ที่ไม่ต้องการสร้างเคสใหม่';
                }
            }
        } else {
            $msg_return['message'] = 'ไม่สามารถตรวจจับข้อความได้ เนื่องจากข้อความไม่ใช่ text';
        }

        Log::channel('webhook_main')->info('ผลการตรวจสอบ keyword', [
            'result' => $msg_return
        ]);

        return $msg_return;
    }
}
