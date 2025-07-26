<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TiktokToken extends Model
{
    protected $fillable = [
        'seller_name',
        'open_id',
        'access_token',
        'access_token_expire_at',
        'refresh_token',
        'refresh_token_expire_at',
        'seller_base_region',
        'granted_scopes',
    ];

    protected $casts = [
        'granted_scopes' => 'array',
        'access_token_expire_at' => 'datetime',
        'refresh_token_expire_at' => 'datetime',
    ];
}
