<?php

namespace App\Http\Controllers\webhooks;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Laravel\Reverb\Loggers\Log;

class TikTokController extends Controller
{
    public function index(Request $request){
        return response()->json(['status' => 'success','request' => $request->all()], 200);
    }
}
