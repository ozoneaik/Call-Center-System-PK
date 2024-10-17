<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @method static create(string[] $array)
 * @method static where(string $string, mixed $content)
 * @method static find($id)
 * @method static select(string $string)
 */
class ShortChats extends Model
{
    use HasFactory;
    protected $fillable = ['content','groups','models','problems'];
}
