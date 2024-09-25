<?php
namespace App\Services;
use App\Models\short_chat;
use Illuminate\Database\Eloquent\Collection;

class ShortChatService{
    public function list(): Collection
    {
        return short_chat::all();
    }
}
