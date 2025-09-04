<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    use HasFactory;
    protected $fillable = [
        'date_time',
        'holiday_name',
        'is_active',
        'created_by',
        'updated_by',
    ];
}
