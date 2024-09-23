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

    public function listNewDm($roomId) : array{
        try {
            $data['progress'] = customers::where('status','progress')->where('roomId',$roomId)->get();
            $data['pending'] = customers::where('status','pending')->where('roomId',$roomId)->get();
            $data['status'] = true;
        }catch (\Exception $exception){
            $data['status'] = false;
        }
        return $data;
    }

    public function detail(string $custId) : array{
        $detail = customers::where('custId', $custId)->first();
        if ($detail){
            $data['find'] = true;
            $data['detail'] = $detail;
        }else{
            $data['find'] = false;
            $data['detail'] = null;
        }
        return $data;
    }

    public function update(string $custId, $FormData){
        $customer = customers::where('custId', $custId)->first();
        $customer->name = $FormData['name'];
        $customer->description = $FormData['description'];
        if ($customer->save()){
            $data['status'] = true;
            $data['customer'] = $customer;
        }else{
            $data['status'] = false;
            $data['customer'] = null;
        }
        return $data;
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
