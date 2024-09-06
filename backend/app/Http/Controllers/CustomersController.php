<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerRequest;
use App\Models\customers;
use App\Services\CustomerService;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Pusher\Pusher;

class CustomersController extends Controller
{
    protected CustomerService $customerService;
    public function __construct(CustomerService $customerService){
        $this->customerService = $customerService;
    }

    public function CustomerList() : JsonResponse{
        $customers = $this->customerService->list();
        return response()->json([
            'message' => 'Success',
            'customers' => $customers
        ]);
    }

    public function changeRoom(CustomerRequest $request) : JsonResponse{
        $request = $request->validated();
        $custId = $request['custId'];
        $roomId = $request['roomId'];
        $update = $this->customerService->changeRoom($custId,$roomId);
        return response()->json([
            'custId' => substr($custId,0,15).'...',
            'message' => $update['message'],
        ],$update['status'] ? 200 : 400);
    }

    public function changeUserReply (Request $request) : JsonResponse{
        $message = 'เกิดข้อผิดพลาด';
        try {
            customers::where('custId',$request->custId)->update(['userReply' => $request->Item]);
            $status = 200;
            $options = [
                'cluster' => env('PUSHER_APP_CLUSTER'),
                'useTLS' => true
            ];
            $pusher = new Pusher(env('PUSHER_APP_KEY'), env('PUSHER_APP_SECRET'), env('PUSHER_APP_ID'), $options);
            $pusher->trigger('notifications', 'my-event', [
                'message' => 'new message'
            ]);
        }catch (\Exception $e){
            $message = $e->getMessage();
            $status  = 500;
        } catch (GuzzleException $e) {
            $message = 'trigger error';
            $status  = 400;
        }
        return response()->json([
            'message' => $message,
        ],$status);
    }
}
