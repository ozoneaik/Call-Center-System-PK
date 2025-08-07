<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TagMenu extends Model
{
    use HasFactory;
    protected $fillable = ['tagName','group_id'];
}
