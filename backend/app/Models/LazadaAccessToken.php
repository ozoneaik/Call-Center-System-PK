<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LazadaAccessToken extends Model
{
    protected $fillable = [
        'seller_id',
        'user_id',
        'account',
        'country',
        'access_token',
        'refresh_token',
        'expired_at',
        'refresh_expired_at',
    ];

    protected $dates = ['expired_at', 'refresh_expired_at'];
}
