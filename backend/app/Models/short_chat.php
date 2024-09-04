<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @method static create(string[] $array)
 */
class short_chat extends Model
{
    use HasFactory;

    protected $fillable = ['chat_text'];
}
