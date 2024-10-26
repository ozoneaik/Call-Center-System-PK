<?php
namespace App\Services;

use App\Models\BotMenu;
use Illuminate\Database\Eloquent\Collection;

class BotService{
    public function list(): Collection {
        return BotMenu::all();
    }
}
