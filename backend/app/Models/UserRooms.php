<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @method static where(string $string, $empCode)
 */
class UserRooms extends Model
{
    use HasFactory;
    protected $fillable = ['roomId','empCode'];
}
