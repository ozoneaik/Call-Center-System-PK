<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @method static where(string $string, $custId)
 * @method static create(array $array)
 * @method static select(string $string)
 * @method static leftJoin(string $string, string $string1, string $string2, string $string3)
 */
class Customers extends Model
{
    use HasFactory;
    protected $fillable = ['custId','custName','description','avatar','platformRef'];
}
