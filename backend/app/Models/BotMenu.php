<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BotMenu extends Model
{
    use HasFactory;

    protected $fillable = ['menuName','roomId'];
}
