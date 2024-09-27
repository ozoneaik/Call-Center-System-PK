<?php
namespace App\Services;

use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use Carbon\Carbon;

class MessageService{
    public function differentTime($S,$T) : string{
        try {
            $startTime = Carbon::parse($S);
            $endTime = Carbon::parse($T);
            $diffInSeconds = $startTime->diffInSeconds($endTime);
            $hours = floor($diffInSeconds / 3600);
            $minutes = floor(($diffInSeconds % 3600) / 60);
            $seconds = $diffInSeconds % 60;
            return "{$hours} ชั่วโมง {$minutes} นาที {$seconds} วินาที";
        }catch (\Exception $e){
            return "เกิดข้อผิดพลาดในการคำนวน";
        }
    }

    public function sendMsgByLine($custId){
        try {
            $customer = Customers::select('platformRef')->where('custId', $custId)->first();
            if ($customer){
                $platformAccessToken = PlatformAccessTokens::where('accessTokenId',$customer['platformRef'])->first();
                if ($platformAccessToken) {
                    $accessToken = $platformAccessToken['accessToken'];
                }
            }else{
                throw new \Exception('ไม่พบ Id');
            }
        }catch (\Exception $e){

        }
    }
}
