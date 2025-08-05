<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaleInformation extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_cust_id',
        'platform_id',
    ];
}
