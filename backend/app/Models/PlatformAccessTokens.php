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
    protected $fillable = ['accessTokenId', 'accessToken', 'description', 'platform', 'page_id', 'app_key', 'app_secret'];
}
