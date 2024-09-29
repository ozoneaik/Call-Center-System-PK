<?php
namespace App\Services;
use App\Models\Rates;

class DisplayService{
    public function MessageList($roomId,$status){
        return  Rates::leftJoin('active_conversations', 'active_conversations.rateRef','=', 'rates.id')
            ->leftJoin('customers', 'rates.custId', 'customers.custId')
            ->where('rates.latestRoomId', $roomId)
            ->where('rates.status', $status)
            ->select('customers.custName','customers.avatar', 'active_conversations.*', 'rates.status')
            ->get();
    }
}
