<?php

namespace App\Services;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Customers;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ActiveConversationService
{
    public function store($custId): array
    {
        $data['message'] = 'สำเร็จ';
        $data['status'] = true;
        try {
            $check = Customers::where('custId', $custId)->first();
            if ($check) {
                if ($check->status !== 'progress') {
                    DB::beginTransaction();
                    customers::where('custId', $custId)->update(['status' => 'progress', 'userReply' => auth()->user()->code]);
                    ActiveConversations::create([
                        'custId' => $custId,
                        'start_time' => Carbon::now(),
                        'user_code' => auth()->user()->code
                    ]);
                    DB::commit();
                } else {
                    throw new \Exception('ขณะนี้ custId คนนี้กำลังดำเนินการอยู่');
                }
            } else throw new \Exception('ไม่พบ custId ในฐานข้อมูล');
        } catch (\Exception $exception) {
            $data['status'] = false;
            $data['message'] = $exception->getMessage();
            DB::rollBack();
        }
        return $data;
    }

    public function endTalk($custId) : array{
        $data['message'] = 'คุณได้จบการสนทนาแล้ว';
        $data['status'] = true;
        try {
            $active = ActiveConversations::where('custId', $custId)->where('end_time',null)->first();
            if (!$active) {
                throw new \Exception('คุณได้ดำเนินจบการสนทนากับลูกค้าคนนี้ไปแล้ว');
            }
            $active->end_time = Carbon::now();
            $chatHistory = ChatHistory::where('custId',$custId)->where('conversationId',$active->id)->get();
            $active->count_chat = count($chatHistory);
            if ($active->save()){
                $customer = customers::where('custId',$custId)->first();
                $customer->status = 'success';
                $customer->save();
            }
        }catch (\Exception $exception){
            $data['status'] = false;
            $data['message'] = $exception->getMessage();
        }

        return $data;
    }
}
