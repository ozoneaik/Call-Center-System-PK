<?php

namespace App\Http\Controllers;

use App\Models\HelpChatModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HelpChatController extends Controller
{
    public function index()
    {
        $helpChats = HelpChatModel::query()->paginate(300);
        return response()->json([
            'message' => 'success',
            'data' => $helpChats,
        ]);
    }

    public function search(Request $request)
    {
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
    public function store(Request $request)
    {
        $validated = $request->validate([
            'search' => 'required|string',
            'problem' => 'required|string',
            'solve' => 'required|string',
            'sku' => 'nullable|string',
            'model' => 'nullable|string',
            'remark' => 'nullable|string',
            'search_vector' => 'nullable|string',
            'skugroup' => 'required|string',
            'cause' => 'required|string',
        ]);

        $new = HelpChatModel::create($validated);

        return response()->json([
            'message' => 'created',
            'data' => $new,
        ], 200);
    }
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'search' => 'required|string',
            'problem' => 'required|string',
            'solve' => 'required|string',
            'sku' => 'nullable|string',
            'model' => 'nullable|string',
            'remark' => 'nullable|string',
            'search_vector' => 'nullable|string',
            'skugroup' => 'required|string',
            'cause' => 'required|string',
        ]);

        $helpChat = HelpChatModel::findOrFail($id);
        $helpChat->update($validated);

        return response()->json([
            'message' => 'updated',
            'data' => $helpChat,
        ]);
    }
    public function destroy($id)
    {
        $helpChat = HelpChatModel::findOrFail($id);
        $helpChat->delete();

        return response()->json([
            'message' => 'deleted',
            'id' => $id,
        ]);
    }
}
