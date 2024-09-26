<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @method static where(string $string, $custId)
 * @method static create(array $array)
 */
class Customers extends Model
{
    use HasFactory;
    protected $fillable = ['custId','custName','description','avatar','platformRef'];
}
