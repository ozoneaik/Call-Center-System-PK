<?php
namespace App\Services;
use App\Models\short_chat;
use Illuminate\Database\Eloquent\Collection;

class shortChatService{
    public function shortChatList(): Collection
    {
        return short_chat::all();
    }
}
