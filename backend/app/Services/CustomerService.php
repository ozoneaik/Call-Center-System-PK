<?php
namespace App\Services;
use App\Models\customers;
use App\Models\Rates;
use Illuminate\Database\Eloquent\Collection;

class CustomerService{

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

    // นับจำนวนเคส (rates) ทั้งหมดของลูกค้าคนนี้ แยกตามห้องที่เคยคุย เพื่อใช้เป็นบริบทประกอบ (เช่น ให้ AI suggestion อ้างอิง)
    public function historySummary(string $custId) : array{
        $totalCases = Rates::query()->where('custId', $custId)->count();

        $rooms = Rates::query()
            ->leftJoin('chat_rooms', 'chat_rooms.roomId', '=', 'rates.latestRoomId')
            ->where('rates.custId', $custId)
            ->groupBy('chat_rooms.roomId', 'chat_rooms.roomName')
            ->orderByDesc('count')
            ->get([
                'chat_rooms.roomId',
                'chat_rooms.roomName',
                \Illuminate\Support\Facades\DB::raw('COUNT(rates.id) as count'),
            ]);

        return [
            'total_cases' => $totalCases,
            'rooms' => $rooms,
        ];
    }

    public function update($custId, $FormData) : array{
        $customer = customers::where('custId', $custId)->first();
        $customer['custName'] = $FormData['custName'];
        $customer['description'] = $FormData['description'];
        if ($customer->save()){
            $data['status'] = true;
            $data['customer'] = $customer;
        }else{
            $data['status'] = false;
            $data['customer'] = null;
        }
        return $data;
    }
}
