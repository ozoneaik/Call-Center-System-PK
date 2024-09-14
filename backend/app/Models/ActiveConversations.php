<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActiveConversations extends Model
{
    use HasFactory;
    protected $fillable = [
        'custId',
        'start_time',
        'end_time',
        'total_time',
        'user_code',
        'count_chat',
    ];
}
