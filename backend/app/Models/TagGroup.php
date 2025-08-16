<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TagGroup extends Model
{
    use HasFactory;
    use SoftDeletes;
    protected $fillable = [
        'group_id',
        'group_name',
        'group_description',
        'created_by_user_id',
        'updated_by_user_id',
        'deleted__by_user_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
}
