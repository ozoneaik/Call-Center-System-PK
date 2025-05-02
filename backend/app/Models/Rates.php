<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @method static where(string $string, mixed $rateId)
 * @method static leftJoin(string $string, string $string1, string $string2, string $string3)
 * @method static select(string $string, string $string1)
 * @method static whereDate(string $string, mixed $today)
 * @method static sum(string $string)
 */
class Rates extends Model
{
    use HasFactory;
    protected $fillable = [
        'custId',
        'rate',
        'latestRoomId',
        'status',
        'tag',
        'menu_select',
    ];
}
