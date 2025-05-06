<?php

namespace App\Http\Controllers;

use App\Models\AnnounceModel;
use Carbon\Carbon;

class AnnounceController extends Controller
{
    public function index(){
        $now = Carbon::now();
        $announces = AnnounceModel::query()
            ->where('start_at', '<=', $now)
            ->where('end_at', '>=', $now)
            ->get();
        return response()->json([
            'announces' => $announces
        ]);
    }
}
