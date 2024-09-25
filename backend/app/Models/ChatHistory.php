<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @method static where(string $string, $custId)
 */
class ChatHistory extends Model
{
    use HasFactory;
    protected $fillable = ['custId','content','contentType','sender','conversationRef'];
}
