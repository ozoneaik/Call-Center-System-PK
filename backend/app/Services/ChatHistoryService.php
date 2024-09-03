<?php
namespace App\Services;
use App\Models\chatHistory;
use App\Models\customers;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;


class ChatHistoryService{
    public function latestMessageList(): Collection
    {
        $messages =  ChatHistory::select(DB::raw('DISTINCT ON ("custId") "custId", "textMessage", "created_at"'))
            ->orderBy('custId')
            ->orderByDesc('created_at')
            ->get();
        return $messages;
    }
}
