<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @method static select(string $string, string $string1)
 */
class BotMenu extends Model
{
    use HasFactory;

    protected $fillable = ['menuName','roomId'];
}
