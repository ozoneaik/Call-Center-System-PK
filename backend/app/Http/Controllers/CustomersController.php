<?php

namespace App\Http\Controllers;

use App\Models\Customers;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomersController extends Controller
{
    protected CustomerService $customerService;

    public function __construct(CustomerService $customerService)
    {
        $this->customerService = $customerService;
    }

    public function CustomerList(Request $request): JsonResponse
    {
        $customers = Customers::query()->paginate(50);
        return response()->json([
            'message' => 'ดึงข้อมูลลูกค้าสำเร็จ',
            'customers' => $customers
        ]);
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
            $customer = $request['customer'];
            $custId = $customer['custId'];
            $message = 'อัพเดทข้อมูลไม่สำเร็จ';
            $status = 400;
            $update = $this->customerService->update($custId,$customer);
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
}
