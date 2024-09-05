<?php
namespace App\Services;
use App\Models\chat_rooms;
use App\Models\customers;
use Illuminate\Database\Eloquent\Collection;

class CustomerService{
    public function list(): Collection
    {
        return customers::all();
    }

    public function changeRoom ($custId,$roomId): array
    {
        $res['message'] = 'เปลี่ยนห้องแชทสำเร็จ';
        $res['status'] = true;
        $checkRoomList = chat_rooms::where('id',$roomId)->first();
        $update = customers::where('custId',$custId)->update(['roomId' => $roomId]);
        if (!$checkRoomList || !$update) {
            $res['message'] = "ไม่พบห้องแชทที่ $roomId";
            $res['status'] = false;
            return $res;
        }
        return $res;
    }
}
