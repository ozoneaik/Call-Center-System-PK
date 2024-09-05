<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @method static where(string $string, $roomId)
 */
class chat_rooms extends Model
{
    use HasFactory;
    protected $fillable = ['name','status','unReads'];
}
