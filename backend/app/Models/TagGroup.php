<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TagGroup extends Model
{
    use HasFactory;
    protected $fillable = [
        'group_id',
        'group_name',
        'group_description',
    ];
}
