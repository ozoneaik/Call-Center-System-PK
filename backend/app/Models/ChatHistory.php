<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @method static where(string $string, $custId)
 * @method static select(\Illuminate\Contracts\Database\Query\Expression $raw)
 */
class ChatHistory extends Model
{
    use HasFactory;
    protected $fillable = ['custId','content','contentType','sender','conversationRef'];
}
