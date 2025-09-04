<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AnnounceModel extends Model
{
    use HasFactory;
    protected $table = 'announces';
    protected $fillable = [
        'detail_text',
        'start_at',
        'end_at',
        'is_active',
    ];
}
