<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @method static where(string $string, $roomId)
 * @method static create(array $array)
 */
class ChatRooms extends Model
{
    use HasFactory;
    protected $fillable =['roomId','roomName','unRead'];
}
