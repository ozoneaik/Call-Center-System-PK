<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @method static create(array $array)
 * @method static where(string $string, $custId)
 * @method static select(string $string, string $string1, string $string2)
 */
class ActiveConversations extends Model
{
    use HasFactory;

    protected $fillable = [
        'custId',
        'roomId',
        'receiveAt',
        'startTime',
        'endTime',
        'totalTime',
        'from_empCode',
        'from_roomId',
        'empCode',
        'rateRef'
    ];
}
