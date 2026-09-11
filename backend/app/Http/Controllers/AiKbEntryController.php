<?php

namespace App\Http\Controllers;

use App\Models\AiKbEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AiKbEntryController extends Controller
{
    // บันทึกความรู้ (คำถาม-คำตอบ) ที่พนักงานกด "เพิ่มเข้า KB" จากหน้าแชท (AI Assistant panel)
    // รองรับแนบรูป/วิดีโอมาด้วย (multipart/form-data, field "attachments[]") — อัปโหลดขึ้น S3
    // ด้วย pattern เดียวกับ MessageController::send() แล้วเก็บ URL ไว้ใน answer_attachments
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
            // อ้างอิงข้อความต้นทางในบทสนทนา (id ของ chat_histories หรือ created_at เป็น fallback)
            // ใช้ตอนแสดงหน้าจำลองแชท (ตรวจสอบ KB) ให้ไฮไลต์ว่ามาจากข้อความไหน
            'message_ref' => 'nullable|string',
            // คำ/วลีที่ใช้แทนกันได้ (คั่นด้วย "|") ช่วยให้ embedding_src ครอบคลุมคำถามที่หลากหลายขึ้น
            // เช่น "สะสมคะแนน | ลงทะเบียนคะแนน | แลกคะแนน" — ใช้โดย pipeline ฝัง embedding ภายนอก
            'alt' => 'nullable|string',
            'attachments' => 'nullable|array|max:6',
            'attachments.*' => 'file|mimes:jpg,jpeg,png,gif,webp,mp4,mov,avi,webm,mkv|max:51200',
        ]);

        // source เก็บเป็นแท็กสั้น ๆ เท่านั้น (คอลัมน์ string(20)) — ค่าที่ไม่รู้จัก/ยาวเกิน จาก service ภายนอก ให้ปัดเป็น null
        $validated['source'] = in_array($validated['source'] ?? null, ['kb', 'web', 'ai'], true)
            ? $validated['source']
            : null;

        $user = $request->user();

        $attachments = [];
        foreach ($request->file('attachments', []) as $file) {
            $mimeType = $file->getMimeType();
            $contentType = match (true) {
                str_starts_with($mimeType, 'image/') => 'image',
                str_starts_with($mimeType, 'video/') => 'video',
                default => 'file',
            };
            $extension = '.' . $file->getClientOriginalExtension();
            $mediaPath = 'kb_' . rand(0, 9999) . time() . $extension;

            Storage::disk('s3')->put($mediaPath, file_get_contents($file->getRealPath()), [
                'visibility'  => 'private',
                'ContentType' => $mimeType,
            ]);

            $attachments[] = [
                'url'         => Storage::disk('s3')->url($mediaPath),
                'contentType' => $contentType,
            ];
        }

        $entry = AiKbEntry::create([
            'question'               => $validated['question'],
            'answer'                 => $validated['answer'],
            'note'                   => $validated['note'] ?? null,
            'source'                 => $validated['source'],
            'tag_name'               => $validated['tag_name'] ?? null,
            'cust_id'                => $validated['cust_id'] ?? null,
            'active_conversation_id' => $validated['active_conversation_id'] ?? null,
            'message_ref'            => $validated['message_ref'] ?? null,
            'alt'                    => $validated['alt'] ?? null,
            'answer_attachments'     => !empty($attachments) ? $attachments : null,
            'created_by'             => $user?->id,
            'created_by_name'        => $user?->real_name ?: $user?->name,
        ]);

        return response()->json([
            'message' => 'บันทึกเข้า KB สำเร็จ',
            'entry' => $entry,
        ], 201);
    }
}
