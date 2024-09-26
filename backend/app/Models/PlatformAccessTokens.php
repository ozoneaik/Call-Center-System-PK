<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlatformAccessTokens extends Model
{
    use HasFactory;
    protected $fillable = ['accessTokenId','accessToken','description','platform'];
}
