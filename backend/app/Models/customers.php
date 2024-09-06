<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @method static where(string $string, mixed $userId)
 * @method static orderBy(string $string, string $string1)
 * @method static create(array $array)
 * @property mixed $custId
 * @property mixed|string $name
 * @property mixed $imageUrl
 * @property mixed|string $platform
 * @property mixed $description
 * @property int|mixed $groupId
 */
class customers extends Model
{
    use HasFactory;
    protected $fillable = ['custId','name','platform','description','roomId','avatar','online'];
}
