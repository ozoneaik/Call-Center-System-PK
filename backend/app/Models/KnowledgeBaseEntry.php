<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KnowledgeBaseEntry extends Model
{
    protected $connection = 'pgsql_kb';
    protected $table = 'knowledge_base_entries';

    protected $fillable = [
        'active_conversation_id',
        'cust_id',
        'chat_data',
        'ai_topic',
        'ai_answer',
        'admin_status',
        'admin_answer',
        'admin_note',
        'approved_by',
        'approved_by_name',
        'approved_at',
        'platform',
        'room_id',
    ];

    protected $casts = [
        'chat_data'   => 'array',
        'approved_at' => 'datetime',
    ];
}
