<?php

namespace App\Http\Controllers\webhooks\new;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LazadaController extends Controller
{
    public function webhookGET(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'message' => 'Lazada webhook GET endpoint is working!'
        ]);
    }

    public function webhookPOST(Request $request)
    {

        // ทำการบันทึกหรือประมวลผลข้อความจากลูกค้า
        Log::info('Lazada webhook payload:',[
            'payload' => json_encode($request->all(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        ]);

        // ส่ง response 200 OK กลับไปเพื่อแจ้งว่าได้รับข้อมูลแล้ว
        // return response()->json(['status' => 'success']);
    }
}
