<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShopeeToken extends Model
{
    protected $fillable = [
        'shop_id',
        'access_token',
        'refresh_token',
        'expire_in',
        'token_created_at',
        'token_expired_at',
    ];

    protected $dates = [
        'token_created_at',
        'token_expired_at',
    ];
}
