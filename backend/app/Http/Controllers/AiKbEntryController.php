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
            'source' => 'nullable|string',
            'tag_name' => 'nullable|string',
            'cust_id' => 'nullable|string',
            'active_conversation_id' => 'nullable|integer',
        ]);

        // source เก็บเป็นแท็กสั้น ๆ เท่านั้น (คอลัมน์ string(20)) — ค่าที่ไม่รู้จัก/ยาวเกิน จาก service ภายนอก ให้ปัดเป็น null
        $validated['source'] = in_array($validated['source'] ?? null, ['kb', 'web', 'ai'], true)
            ? $validated['source']
            : null;

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
