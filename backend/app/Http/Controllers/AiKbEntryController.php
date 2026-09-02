<?php

namespace App\Http\Controllers;

use App\Models\AiKbEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiKbEntryController extends Controller
{
    // บันทึกความรู้ (คำถาม-คำตอบ) ที่พนักงานกด "เพิ่มเข้า KB" จากหน้าแชท (AI Assistant panel)
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question' => 'required|string',
            'answer' => 'required|string',
            'note' => 'nullable|string',
            'source' => 'nullable|string|max:20',
            'tag_name' => 'nullable|string',
            'cust_id' => 'nullable|string',
            'active_conversation_id' => 'nullable|integer',
        ]);

        $user = $request->user();

        $entry = AiKbEntry::create([
            ...$validated,
            'created_by' => $user?->id,
            'created_by_name' => $user?->real_name ?: $user?->name,
        ]);

        return response()->json([
            'message' => 'บันทึกเข้า KB สำเร็จ',
            'entry' => $entry,
        ], 201);
    }
}
