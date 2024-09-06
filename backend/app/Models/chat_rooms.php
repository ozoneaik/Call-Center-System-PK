<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;


/**
 * @method static where(string $string, $roomId)
 * @method static create(array $array)
 */
class chat_rooms extends Model
{
    use HasFactory;
    protected $fillable = ['name','status','unReads'];

    protected static function boot(): void
    {
        parent::boot();

        // เพิ่ม global scope เพื่อเรียงลำดับตาม id จากมากไปหาน้อย
        static::addGlobalScope('orderById', function (Builder $builder) {
            $builder->orderBy('id', 'asc');
        });
    }
}
