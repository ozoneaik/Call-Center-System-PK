<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Validator;

class sendMessageRequest extends FormRequest
{
    /** ชนิดไฟล์ที่ส่งในแชทได้ (ตรวจจากเนื้อไฟล์จริง ไม่ใช่นามสกุล) — ต้องตรงกับ accept ใน MessageInputNew.jsx */
    public const FILE_MIMES = [
        'image' => ['image/jpeg', 'image/png'],
        'video' => ['video/mp4', 'video/quicktime', 'video/webm'],
        'file'  => ['application/pdf'],
    ];

    public const MAX_FILE_KB = 25600;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'custId' => 'required',
            'conversationId' => 'required',
            'messages' => 'required|array',
            'messages.*.contentType' => 'required|string',
        ];
    }

    /** ไฟล์แนบ: contentType ต้องเป็น image/video/file และชนิดไฟล์จริงต้องตรงกับ contentType */
    public function after(): array
    {
        return [function (Validator $validator) {
            foreach ((array) ($this->all()['messages'] ?? []) as $i => $m) {
                $content = $m['content'] ?? null;
                $type = $m['contentType'] ?? null;
                $isFileType = isset(self::FILE_MIMES[$type]);
                if (!$content instanceof UploadedFile && !$isFileType) continue;

                if (!$content instanceof UploadedFile || !$content->isValid()) {
                    $validator->errors()->add("messages.$i.content", 'ไฟล์แนบไม่ถูกต้อง (Invalid file)');
                } elseif (!$isFileType || !in_array($content->getMimeType(), self::FILE_MIMES[$type], true)) {
                    $validator->errors()->add("messages.$i.content", 'ไม่รองรับไฟล์ชนิดนี้ — ส่งได้เฉพาะ jpg, png, mp4, mov, webm, pdf');
                } elseif ($content->getSize() > self::MAX_FILE_KB * 1024) {
                    $validator->errors()->add("messages.$i.content", 'ไฟล์ใหญ่เกิน ' . (self::MAX_FILE_KB / 1024) . ' MB');
                }
            }
        }];
    }

    public function messages(): array{
        return [
            'custId.required' => 'ไม่พบ field custId',
            'conversationId.required' => 'ไม่พบ field conversationId',
            'messages.required' => 'ไม่พบ field messages',
        ];
    }
}
