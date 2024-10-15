<?php
namespace App\Services;

use App\Models\ChatRooms;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DashboardService{
    public function countChatLastWeek($sevenDaysAgo) : array{
        $chatCountsRaw = DB::table('chat_histories')
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(content) as content_count'))
            ->where('created_at', '>=', $sevenDaysAgo)
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'desc')
            ->get();
        $chatCounts = [];
        $dates = [];
        for ($i = 0; $i <= 6; $i++) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            $dates[$date] = 0;
        }
        foreach ($chatCountsRaw as $chat) {
            $dates[$chat->date] = $chat->content_count;
        }
        foreach ($dates as $date => $count) {
            $chatCounts[] = [
                'date' => $date,
                'content_count' => $count
            ];
        }
        return $chatCounts;
    }

    public function countCustomer($today) : array{
        $newCustomers = DB::table('customers')
            ->select(DB::raw('COUNT(DISTINCT "custId") as new_customer_count'))
            ->whereDate('created_at', $today)
            ->first();
        $totalCustomers = DB::table('chat_histories')
            ->leftJoin('customers', 'chat_histories.custId', '=', 'customers.custId')
            ->select(DB::raw('COUNT(DISTINCT customers."custId") as total_customer_count'))
            ->whereDate('chat_histories.created_at', $today)
            ->first();
        return [
            'newCust' => $newCustomers ? $newCustomers->new_customer_count : 0,
            'totalToday' => $totalCustomers ? $totalCustomers->total_customer_count : 0,
        ];
    }

    public function countStar($today): array
    {
        $chatRooms = ChatRooms::with(['rates' => function ($query) use ($today) {
            $query->whereDate('created_at', $today);
        }])->get();
        $rooms = [];
        foreach ($chatRooms as $key => $chatRoom) {
            $totalRate = $chatRoom->rates->sum('rate');
            $rooms[$key] = [
                'roomName' => $chatRoom->roomName,
                'count' => $totalRate,
            ];
        }
        return $rooms;
    }

    public function countChat($today): Collection
    {
        return  DB::table('chat_rooms')
            ->selectRaw('COALESCE(COUNT(chat_histories.content), 0) AS total_chats, chat_rooms."roomId", chat_rooms."roomName"')
            ->leftJoin('active_conversations', 'chat_rooms.roomId', '=', 'active_conversations.roomId')
            ->leftJoin('chat_histories', function($join) use ($today) {
                $join->on('active_conversations.id', '=', 'chat_histories.conversationRef')
                    ->whereDate('chat_histories.created_at', '=', $today);
            })
            ->groupBy('chat_rooms.roomId', 'chat_rooms.roomName')
            ->get();
    }

    public function pendingChats($today) : Collection{
        return DB::table('rates')
            ->select('chat_rooms.roomName', DB::raw('COUNT(rates."custId") as cust_count'))
            ->leftJoin('chat_rooms', 'rates.latestRoomId', '=', 'chat_rooms.roomId')
            ->where('rates.status', 'pending')
            ->whereDate('rates.created_at', $today)
            ->groupBy('chat_rooms.roomName')
            ->get();
    }
}
