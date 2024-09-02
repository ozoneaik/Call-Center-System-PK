<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property mixed $custId
 * @property mixed $textMessage
 * @property mixed $typeMessage
 */
class chatHistory extends Model
{
    use HasFactory;

//    protected $table = 'chat_history';

    protected $fillable = ['custId','typeMessage','textMessage','platform'];
}
