<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TagByPlatforms extends Model
{
    //
    protected $fillable = [
        'platform_name',
        'tag_id'
    ];
}
