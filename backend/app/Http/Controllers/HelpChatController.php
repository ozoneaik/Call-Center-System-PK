<?php

namespace App\Http\Controllers;

use App\Models\HelpChatModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HelpChatController extends Controller
{
    public function index(){
        $helpChats = HelpChatModel::query()->paginate(300);
        return response()->json([
            'message' => 'success',
            'data' => $helpChats,
        ]);
    }

    public function search(Request $request){
        if (!isset($request->value) || $request->value == null || $request->value == "") {
            return response()->json([
                'message' => 'error',
                'data' => null,
            ]);
        }
        $search = $request->value;
        $serachArray = explode(" ", $search);
        $arrayString = "ARRAY[" . implode(',', array_map(fn($k) => DB::getPdo()->quote($k), $serachArray)) . "]";
        $sql = "SELECT * FROM search_all_keywords($arrayString)";
        $results = DB::select($sql);
        return response()->json([
            'search' => $search,
            'searchArray' => $serachArray,
            'results' => $results,
        ]);
    }
}
