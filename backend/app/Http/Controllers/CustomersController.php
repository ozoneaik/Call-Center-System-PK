<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerRequest;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;

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
}
