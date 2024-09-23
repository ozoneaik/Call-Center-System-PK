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

    public function __construct(CustomerService $customerService)
    {
        $this->customerService = $customerService;
    }

    public function CustomerList(): JsonResponse
    {
        $customers = $this->customerService->list();
        return response()->json([
            'message' => 'Success',
            'customers' => $customers
        ]);
    }

    public function CustomerListNewDm($roomId) : JsonResponse{
        $message = 'ดึงข้อมูลไม่สำเร็จ';
        $status = 400;
        try {
            $customers = $this->customerService->listNewDm($roomId);
            if ($customers['status']){
                $message = 'ดึงข้อมูลสำเร็จ';
                $status = 200;
            }else{
                $customers['progress'] = [];
                $customers['pending'] = [];
            }
        }catch (\Exception $exception){
            $status = 500;
            $message = $exception->getMessage();
        }
        return response()->json([
            'message' => $message,
            'progress' => $customers['progress'],
            'pending' => $customers['pending'],
        ],$status);
    }

    public function CustomerDetail(string $custId): JsonResponse
    {
        try {
            $message = 'ดึงข้อมูลไม่สำเร็จ';
            $status = 400;
            $detail = [];
            $data = $this->customerService->detail($custId);
            if ($data['find']) {
                $status = 200;
                $message = 'ดึงข้อข้อมูลสำเร็จ';
                $detail = $data['detail'];
            }
            return response()->json([
                'message' => $message,
                'detail' => $detail,
            ], $status);
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function UpdateCustomer(Request $request): JsonResponse
    {
        try {
            $message = 'อัพเดทข้อมูลไม่สำเร็จ';
            $status = 400;
            $update = $this->customerService->update($request->custId,$request->detail);
            if ($update['status']) {
                $status = 200;
                $message = 'อัพเดทข้อมูลสำเร็จ';
                $customer = $update['customer'];
            }
            return response()->json([
                'message' => $message,
                'customer' => $customer ? $customer : null,
            ], $status);
        }catch (\Exception $e){
            return response()->json([
                'message' => $e->getMessage()
            ],500);
        }
    }

    public function changeRoom(CustomerRequest $request): JsonResponse
    {
        $request = $request->validated();
        $custId = $request['custId'];
        $roomId = $request['roomId'];
        $update = $this->customerService->changeRoom($custId, $roomId);
        return response()->json([
            'custId' => substr($custId, 0, 15) . '...',
            'message' => $update['message'],
        ], $update['status'] ? 200 : 400);
    }

    public function changeUserReply(Request $request): JsonResponse
    {
        $message = 'เกิดข้อผิดพลาด';
        try {
            customers::where('custId', $request->custId)->update(['userReply' => $request->Item]);
            $status = 200;
            $options = [
                'cluster' => env('PUSHER_APP_CLUSTER'),
                'useTLS' => true
            ];
            $pusher = new Pusher(env('PUSHER_APP_KEY'), env('PUSHER_APP_SECRET'), env('PUSHER_APP_ID'), $options);
            $pusher->trigger('notifications', 'my-event', [
                'message' => 'new message'
            ]);
        } catch (\Exception $e) {
            $message = $e->getMessage();
            $status = 500;
        } catch (GuzzleException $e) {
            $message = 'trigger error';
            $status = 400;
        }
        return response()->json([
            'message' => $message,
        ], $status);
    }
}
