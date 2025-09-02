<?php
namespace App\Services;
use App\Models\customers;
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
