<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiKbEntry extends Model
{
    protected $connection = 'pgsql_kb';
    protected $table = 'ai_kb_entries';

    protected $fillable = [
        'question',
        'answer',
        'note',
        'source',
        'tag_name',
        'cust_id',
        'active_conversation_id',
        'message_ref',
        'answer_attachments',
        'alt',
        'created_by',
        'created_by_name',
        'is_active',
        'admin_status',
        'admin_answer',
        'admin_note',
        'approved_by',
        'approved_by_name',
        'approved_at',
    ];

    protected $casts = [
        'is_active'   => 'boolean',
        'approved_at' => 'datetime',
        'answer_attachments' => 'array',
    ];
}
