<?php

namespace App\Models;

use Illuminate\Contracts\Database\Query\Expression;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property mixed $custId
 * @property mixed $sender
 * @property mixed $content
 * @property mixed $contentType
 * @method static select(Expression $raw)
 * @method static where(string $string, mixed $custId)
 */
class chatHistory extends Model
{
    use HasFactory;

//    protected $table = 'chat_history';

    protected $fillable = ['custId','content','contentType','attachment','sender','usersReply','platform'];
}
