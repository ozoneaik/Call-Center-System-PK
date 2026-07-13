<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformRoutingRule extends Model
{
    protected $fillable = [
        'token_id',
        'room_id',
        'is_allowed',
        'allow_create_case',
    ];

    protected $casts = [
        'is_allowed'        => 'boolean',
        'allow_create_case' => 'boolean',
    ];

    public function token()
    {
        return $this->belongsTo(PlatformAccessTokens::class, 'token_id');
    }
}
