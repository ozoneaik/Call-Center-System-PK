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
        'question',
        'content',
        'source',
        'reference',
    ];
}
