<?php

namespace App\Http\Controllers;

use App\Models\Customers;
use App\Models\Rates;
use Illuminate\Http\Request;

class feedbackController extends Controller
{
    public function index($custId, $rateId)
    {
        try {
            $customer = Customers::query()->where('custId', $custId)->first();
            if ($customer) {
                $rate = Rates::query()->where('id', $rateId)->first();
                if ($rate && $rate->status === 'success') {
                    return response()->json([
                        'message' => 'ดึงข้อมูลสำเร็จ',
                        'data' => [
                            'customer' => $customer,
                            'rate' => $rate,
                        ],
                        'status_feedback' => isset($rate->feedback_description) ? 'submitted' : 'not_submitted'
                    ]);
                }else throw new \Exception('เคสสถานะยังไม่สำเร็จ');
            }
            throw new \Exception('ไม่พบข้อมูลลูกค้า');
        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function feedback(Request $request)
    {
        $rateId = $request->input('rateId');
        $feedback_description = $request->input('feedback_description');
        $rate = Rates::query()->where('id', $rateId)->first();
        if ($rate) {
            $rate->feedback_description = $feedback_description;
            $rate->save();
        } else {
            return response()->json([
                'message' => 'ไม่พบข้อมูลการให้คะแนน',
            ], 404);
        }
    }
}
