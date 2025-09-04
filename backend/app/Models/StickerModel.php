<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StickerModel extends Model
{
    use HasFactory;

    protected $fillable = [
        'path',
        'is_active'
    ];
}
