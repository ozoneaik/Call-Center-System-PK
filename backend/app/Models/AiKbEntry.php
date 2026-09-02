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
        'created_by',
        'created_by_name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
