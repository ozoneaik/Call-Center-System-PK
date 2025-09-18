<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatRooms extends Model
{
    use HasFactory;
    protected $fillable =['roomId','roomName','unRead','is_active', 'is_spam'];

    public function rates(): HasMany
    {
        return $this->hasMany(Rates::class, 'latestRoomId', 'roomId');
    }
}
