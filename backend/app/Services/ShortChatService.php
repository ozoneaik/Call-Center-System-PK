<?php
namespace App\Services;
use App\Models\ShortChats;
use Illuminate\Database\Eloquent\Collection;

class ShortChatService{
    public function list(): Collection
    {
        $list = ShortChats::all();
        return ShortChats::all();
    }
}
