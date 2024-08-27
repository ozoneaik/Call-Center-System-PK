<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class short_chat extends Model
{
    use HasFactory;

    protected $fillable = ['chat_text'];
}
