<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiLiveSuggestion extends Model
{
    protected $table = 'ai_live_suggestions';

    protected $fillable = [
        'active_conversation_id',
        'cust_id',
        'message_ref',
        'context_sent',
        'question',
        'content',
        'source',
        'reference',
        'attachment_url',
    ];

    // context_sent เก็บเป็น JSON string ในคอลัมน์ text ({lines: string[], image_url: string|null}) — cast เป็น
    // array ให้ทำงานเหมือน column json ปกติ (encode/decode ให้อัตโนมัติ) โดยไม่ต้องแก้ type คอลัมน์จริงใน DB
    protected $casts = [
        'context_sent' => 'array',
    ];
}
