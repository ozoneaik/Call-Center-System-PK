<?php

namespace App\Services\webhooks_new;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Keyword;
use App\Models\Rates;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class FilterCase
{
    protected $MESSAGE;
    protected $CUSTOMER;
    protected $PLATFORM_ACCESS_TOKEN;
    protected $BOT;
    public function __construct()
    {
        $this->BOT = User::query()->where('empCode', 'BOT')->first();
    }

    public function filterCase($customer = null, $message = null, $platformAccessToken = null)
    {
        Log::channel('webhook_main')->info('เริ่มกรองเคส', [
            'customer' => json_encode($customer, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            'message' => json_encode($message, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            'platformAccessToken' => json_encode($platformAccessToken, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        ]);
        try {
            // เช็คก่อนว่า มี $customer หรือ $message หรือ $platformAccessToken ครบทั้งสามอย่างหรือไม่
            $check_params = $this->checkParams($customer, $message, $platformAccessToken);
            if (!$check_params['status']) throw new \Exception($check_params['message']);
            $this->MESSAGE = $message;
            $this->CUSTOMER = $customer;
            $this->PLATFORM_ACCESS_TOKEN = $platformAccessToken;

            // ตรวจสอบ Rate ปัจจุบันก่อน
            $current_rate = Rates::query()->where('custId', $customer['custId'])
                ->orderBy('id', 'desc')->first();
            if (!$current_rate) {
                $this->newCase($current_rate);
            } elseif ($current_rate['statsus'] === 'pending') {
                $this->pendingCase($current_rate);
            } elseif ($current_rate['status'] === 'progress') {
                $this->progressCase($current_rate);
            } else {
                $this->successCase($current_rate);
            }

            return ['status' => true, 'message' => 'กรองสำเร็จ'];
        } catch (\Exception $e) {
            return ['status' => false, 'message' => $e->getMessage()];
        }
    }

    private function newCase($current_rate)
    {
        Log::channel('webhook_main')->info('ปัจจุบันเป็นเคสใหม่ ไม่เคยสร้างเคส');
        $keyword = $this->checkKeyword($this->MESSAGE);
        if ($keyword['status']) {
            $new_rate = Rates::query()->create([
                'custId' => $this->CUSTOMER['custId'],
                'latestRoomId' => $keyword['redirectTo'],
                'status' => 'pending'
            ]);
            $new_ac = ActiveConversations::query()->create([
                'custId' => $this->CUSTOMER['custId'],
                'roomId' => $keyword['redirectTo'],
                'rateRef' => $new_rate['id']
            ]);
        } else {
            $now = Carbon::now();
            $new_rate = Rates::query()->create([
                'custId' => $this->CUSTOMER['custId'],
                'latestRoomId' => 'ROOM00',
                'status' => 'progress'
            ]);
            $new_ac = ActiveConversations::query()->create([
                'custId' => $this->CUSTOMER['custId'],
                'roomId' => 'ROOM00',
                'receiveAt' => $now,
                'startTime' => $now,
                'empCode' => 'BOT',
                'rateRef' => $new_rate['id']
            ]);
        }
        $store_chat = ChatHistory::query()->create([
            'custId' => $this->CUSTOMER['custId'],
            'content' => $this->MESSAGE['content'],
            'contentType' => $this->MESSAGE['contentType'],
            'sender' => 
        ]);
    }

    private function pendingCase($current_rate)
    {
        Log::channel('webhook_main')->info('ปัจจุบันเป็นเคสอยู่ในสถานะรอดำเนินการ');
        $this->checkKeyword($this->MESSAGE);
    }

    private function progressCase($current_rate)
    {
        Log::channel('webhook_main')->info('ปัจจุบันเป็นเคสกำลังดำเนินการ');
    }

    private function successCase($current_rate)
    {
        Log::channel('webhook_main')->info('ปัจจุบันเป็นเคสที่เคสสำเร็จแล้ว');
        $this->checkKeyword($this->MESSAGE);
    }

    private function checkKeyword($message)
    {
        $msg_return = ['status' => false, 'message' => 'ไม่ตรงใน keyword', 'redirectTo' => null];
        if ($message['contentType'] === 'text') {
            $keyword = Keyword::query()->where('name', 'LIKE', '%' . $message['text'] . '%')->first();
            if ($keyword) {
                if (!$keyword['event']) {
                    $msg_return['message'] = 'เจอ keyword ที่ไม่เป็นของจบสนทนา';
                    $msg_return['redirectTo'] = $keyword['redirectTo'];
                } else {
                    $msg_return['message'] = 'เจอ keyword ที่เป็นของจบสนทนาไปแล้ว';
                }
            }
        } else {
            $msg_return['message'] = 'ไม่สามารถตรวจจับข้อความได้ เนื่องจากข้อความไม่ใช่ text';
        }
        return $msg_return;
    }


    private function checkParams($customer = null, $message = null, $platformAccessToken = null)
    {
        try {
            // ถ้าไม่เจอ $customer หรือ $message หรือ $platformAccessToken
            if (is_null($customer) || is_null($message) || is_null($platformAccessToken)) {
                if (is_null($customer)) throw new \Exception('ไม่พบ customer');
                elseif (is_null($message)) throw new \Exception('ไม่พบ message');
                else throw new \Exception('ไม่พบ platformAccessToken');
            } else return ['status' => true, 'message' => 'ตรวจสอบสําเร็จ'];
        } catch (\Exception $e) {
            $msg_error = $e->getMessage() . ' ' . $e->getFile() . ' ' . $e->getLine();
            $msg_error_default = 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ ใน fn checkParams';
            return [
                'status' => false,
                'message' => $msg_error ?? $msg_error_default
            ];
        }
    }
}
