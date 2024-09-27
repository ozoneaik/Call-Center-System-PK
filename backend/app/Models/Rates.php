<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @method static where(string $string, mixed $rateId)
 */
class Rates extends Model
{
    use HasFactory;
    protected $fillable = ['custId','rate','latestRoomId','status'];
}
