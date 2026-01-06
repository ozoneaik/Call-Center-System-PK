<?php

namespace App\Http\Controllers;

use App\Models\HelpChatModel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HelpChatController extends Controller
{
    public function index()
    {
        $helpChats = HelpChatModel::whereNull('deleted_by')
            ->orderBy('id', 'asc')
            ->paginate(300);
        return response()->json([
            'message' => 'success',
            'data' => $helpChats,
        ]);
    }

    public function search(Request $request)
    {
        if (!$request->filled('value')) {
            return response()->json([
                'message' => 'error',
                'data' => [],
            ]);
        }
        $search = $request->value;
        $searchArray = explode(" ", $search);
        $query = HelpChatModel::query();
        $query->whereNull('deleted_by');
        $query->where(function ($q) use ($searchArray) {
            foreach ($searchArray as $word) {
                $q->where(function ($subQ) use ($word) {
                    $subQ->where('search', 'LIKE', "%{$word}%")
                        ->orWhere('problem', 'LIKE', "%{$word}%")
                        ->orWhere('solve', 'LIKE', "%{$word}%")
                        ->orWhere('cause', 'LIKE', "%{$word}%");
                });
            }
        });

        $results = $query->get();
        return response()->json([
            'search' => $search,
            'searchArray' => $searchArray,
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
        
        if ($request->user()) {
            $validated['created_by'] = $request->user()->empCode;
        }

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
        if ($request->user()) {
            $validated['updated_by'] = $request->user()->empCode;
        }
        $helpChat->update($validated);

        return response()->json([
            'message' => 'updated',
            'data' => $helpChat,
        ]);
    }
    public function destroy(Request $request, $id)
    {
        $helpChat = HelpChatModel::findOrFail($id);

        if ($request->user()) {
            $helpChat->update(['deleted_by' => $request->user()->empCode]);
        } else {
            // กรณีไม่มี user login (ถ้ามีเคสนี้) อาจจะใส่ค่า default หรือปล่อยผ่าน
            $helpChat->update(['deleted_by' => 'system']);
        }

        // $helpChat->delete();

        return response()->json([
            'message' => 'deleted',
            'id' => $id,
        ]);
    }
}
