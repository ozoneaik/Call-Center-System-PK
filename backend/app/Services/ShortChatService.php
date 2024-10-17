<?php
namespace App\Services;
use App\Models\ShortChats;
use Illuminate\Database\Eloquent\Collection;

class ShortChatService{
    public function list(): Collection
    {
        return ShortChats::select('groups')->groupBy('groups')->get();
    }
}
