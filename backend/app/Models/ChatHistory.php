<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @method static where(string $string, $custId)
 * @method static select(\Illuminate\Contracts\Database\Query\Expression $raw)
 * @method static whereDate(string $string, string $today)
 */
class ChatHistory extends Model
{
    use HasFactory;
    protected $fillable = [
        'custId',
        'content',
        'contentType',
        'sender',
        'conversationRef',
        'line_message_id',
        'line_quote_token',
        'line_quoted_message_id',
        'facebook_message_id'
    ];
}
