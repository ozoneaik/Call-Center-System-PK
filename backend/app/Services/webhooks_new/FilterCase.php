<?php

namespace App\Services\webhooks_new;

use App\Models\Rates;
use App\Models\User;
use App\Services\PusherService;
use Illuminate\Support\Facades\Log;

class FilterCase
{
    protected $MESSAGE;
    protected $CUSTOMER;
    protected $PLATFORM_ACCESS_TOKEN;
    protected $BOT;
    protected PusherService $pusherService;
    protected NewCase $newCase;
    protected ProgressCase $progressCase;
    protected PendingCase $pendingCase;
    protected SuccessCase $successCase;
    public function __construct(PusherService $pusherService, NewCase $newCase, ProgressCase $progressCase, PendingCase $pendingCase, SuccessCase $successCase)
    {
        $this->pusherService = $pusherService;
        $this->BOT = User::query()->where('empCode', 'BOT')->first();
        $this->newCase = $newCase;
        $this->progressCase = $progressCase;
        $this->pendingCase = $pendingCase;
        $this->successCase = $successCase;
    }
    protected $end_log_line = '---------------------------------------------------🌚 สิ้นสุดกรองเคส---------------------------------------------------';

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
                $this->newCase->case($this->MESSAGE, $this->CUSTOMER, $this->PLATFORM_ACCESS_TOKEN, $this->BOT);
            } elseif ($current_rate['status'] === 'pending') {
                $this->pendingCase->case($this->MESSAGE, $current_rate, $this->CUSTOMER, $this->PLATFORM_ACCESS_TOKEN, $this->BOT);
            } elseif ($current_rate['status'] === 'progress') {
                $this->progressCase->case($this->MESSAGE, $current_rate, $this->CUSTOMER, $this->PLATFORM_ACCESS_TOKEN, $this->BOT);
            } else {
                $this->successCase->case($this->MESSAGE, $current_rate, $this->CUSTOMER, $this->PLATFORM_ACCESS_TOKEN, $this->BOT);
            }
            Log::channel('webhook_main')->info($this->end_log_line); //สิ้นสุดกรองเคส
            return ['status' => true, 'message' => 'กรองสำเร็จ'];
        } catch (\Exception $e) {
            return ['status' => false, 'message' => $e->getMessage()];
        }
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
