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
        'laz_seller_id',
        'laz_app_key',
        'laz_app_secret',
        'laz_refresh_token',
        'fb_page_id',
        'fb_verify_token',
        'room_default_id',

        'shopee_partner_id',
        'shopee_partner_key',
        'shopee_shop_id',
        'shopee_refresh_token',
        'shopee_code',

        'expire_at',
        'usage_type',

        // 'tiktok_service_id',
        'tiktok_open_id',
        'tiktok_shop_id',
        'tiktok_seller_name',
        'tiktok_region',
        'tiktok_app_key',
        'tiktok_app_secret',
        'tiktok_refresh_token',
        // 'tiktok_refresh_token_expire',
    ];

    protected $dates = [
        'expire_at',
        'created_at',
        'updated_at',
    ];
}
