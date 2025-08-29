<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @method static create(string[] $array)
 * @method static findOrFail(mixed $request)
 */
class PlatformAccessTokens extends Model
{
    use HasFactory;
    protected $fillable = [
        'accessTokenId',
        'accessToken',
        'description',
        'platform',
        'laz_app_key',
        'laz_app_secret',
        'fb_page_id',
        'fb_verify_token',
        'room_default_id',

        'shopee_partner_id',
        'shopee_partner_key',
        'shopee_shop_id',
        'shopee_refresh_token',
        'shopee_code',

        'expire_at'
    ];

    protected $dates = [
        'expire_at',
        'created_at',
        'updated_at',
    ];
}
