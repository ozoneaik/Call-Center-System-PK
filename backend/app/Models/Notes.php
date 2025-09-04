<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @method static where(string $string, $custId)
 * @method static findOrFail($noteId)
 */
class Notes extends Model
{
    use HasFactory;
    protected $fillable = ['custId','text'];
}
