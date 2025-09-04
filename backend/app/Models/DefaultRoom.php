<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DefaultRoom extends Model
{
    use HasFactory;

    protected $fillable = [
        'platform_id',
        'room_id',
    ];
}
