<?php

namespace App\Http\Controllers;

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
}
