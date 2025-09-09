<?php

namespace App\Http\Controllers;

use App\Http\Requests\selectMessageRequest;
use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\ChatRooms;
use App\Models\Customers;
use App\Models\Notes;
use App\Models\PlatformAccessTokens;
use App\Models\Rates;
use App\Models\TagMenu;
use App\Services\DashboardService;
use App\Services\DisplayService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PDO;

class DisplayController extends Controller
{
    protected DisplayService $displayService;
    protected DashboardService $dashboardService;

    public function __construct(DisplayService $displayService, DashboardService $dashboardService)
    {
        $this->displayService = $displayService;
        $this->dashboardService = $dashboardService;
    }

    public function displayMessageList($roomId): JsonResponse
    {
        $pending = $this->displayService->MessageList($roomId, 'pending');
        $progress = $this->displayService->MessageList($roomId, 'progress');
        return response()->json([
            'message' => 'displayMessageList',
            'pending' => $pending,
            'progress' => $progress
        ]);
    }

    public function selectMessage($custId, $from, selectMessageRequest $request): JsonResponse
    {
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $list = $this->displayService->selectMessage($custId);
            if (!$list) throw new \Exception('เกิดปัญหาในการ query select');
            if ($list->isEmpty()) throw new \Exception('ไม่พบรายการ Chat');
            $sender = Customers::query()->where('custId', $custId)->first();
            if (!$sender) throw new \Exception('ไม่พบ sender');
            $emp = $this->displayService->getEmpReply($request['activeId']);
            $room = ActiveConversations::query()->where('id', $request['activeId'])->first();
            $room = ChatRooms::query()->where('roomId', $room['roomId'])->first();
            if (!$emp) {
                if ($from === 'S') {
                    $emp = 0000;
                } else throw new \Exception('ไม่พบ พนักงานที่รับเรื่อง');
            };
            //            if (!$emp) throw new \Exception('ไม่พบ พนักงานที่รับเรื่อง');
            $sender['emp'] = $emp;

            $starList = Rates::query()
                ->leftJoin('tag_menus', 'rates.tag', '=', 'tag_menus.id')
                ->select('rates.rate', 'rates.tag', 'rates.updated_at', 'tag_menus.tagName')
                ->where('rates.custId', $custId)
                ->orderBy('rates.updated_at', 'desc')
                ->get();

            $notes = Notes::query()->where('custId', $custId)->orderBy('created_at', 'desc')->get();

            $tags = TagMenu::all();

            // $sender = Customers::query()->where('custId', $custId)->first();
            // if (!$sender) throw new \Exception('ไม่พบ sender');

            // $platformRow = DB::table('platform_access_tokens')
            //     ->where('id', $sender->platformRef)
            //     ->first();

            // $platformName = $platformRow->platform ?? null;

            // $usedTagsByOtherPlatforms = DB::table('tag_by_platforms')
            //     ->where('platform_name', '!=', $platformName)
            //     ->pluck('tag_id')
            //     ->toArray();

            // $tags = DB::table('tag_by_platforms')
            //     ->join('tag_menus', 'tag_by_platforms.tag_id', '=', 'tag_menus.id')
            //     ->select('tag_menus.id', 'tag_menus.tagName')
            //     ->where('tag_by_platforms.platform_name', $platformName)
            //     ->whereNotIn('tag_menus.id', $usedTagsByOtherPlatforms)
            //     ->distinct()
            //     ->get();

            // if ($tags->isEmpty()) {
            //     $tags = TagMenu::select('id', 'tagName')
            //         ->whereNotIn('id', $usedTagsByOtherPlatforms)
            //         ->distinct()
            //         ->get();
            // }

            $message = 'ดึงข้อมูลสำเร็จ';
            $status = 200;
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail' => $detail,
                'room' => $room ?? [],
                'rateId' => $request['rateId'],
                'activeId' => $request['activeId'],
                'sender' => $sender ?? [],
                'custId' => $custId,
                'list' => $list ?? [],
                'starList' => $starList ?? [],
                'notes' => $notes ?? [],
                'tags' => $tags ?? []
            ], $status ?? 400);
        }
    }

    public function Dashboard(Request $request): JsonResponse
    {
        $sevenDaysAgo = Carbon::now()->subDays(7);

        // ดึงจำนวนข้อความแชท 7 วันล่าสุด
        $chatCounts = $this->dashboardService->countChatLastWeek($sevenDaysAgo);

        $today = $request['date'] ?? Carbon::now()->format('Y-m-d');
        // ดึงจำนวนลูกค้าที่ทักมาวันนี้
        $customers = $this->dashboardService->countCustomer($today);
        //ดึงจำนวนดาววันนี้
        $stars['rooms'] = $this->dashboardService->countStar($today);
        $stars['total'] = Rates::query()->whereDate('created_at', $today)->sum('rate');

        //ดึงจำนวนแชทวันนี้
        $countChats['rooms'] = $this->dashboardService->countChat($today);
        $countChats['total'] = ChatHistory::query()->whereDate('created_at', $today)->count('id');

        // ดึงอันดับพนักงานที่รับเรื่องมากที่สุด
        $topEmployee = $this->TopEmployee();

        //ดึงจำนวนแชทที่ค้าง
        $pendingChats = $this->dashboardService->pendingChats($today);

        return response()->json([
            'selectDate' => $today,
            'sevenDaysAgo' => $chatCounts,
            'customers' => $customers,
            'chatCounts' => $countChats,
            'stars' => $stars,
            'pendingChats' => $pendingChats,
            'topEmployee' => $topEmployee,
        ]);
    }

    public function MyMessages($empCode): JsonResponse
    {
        $myMessages = $this->dashboardService->myMessages($empCode);
        return response()->json([
            'message' => "success $empCode",
            'detail' => $myMessages
        ]);
    }

    public function myCase()
    {
        $result = Rates::query()->leftJoin('active_conversations', 'active_conversations.rateRef', '=', 'rates.id')
            ->leftJoin('customers', 'rates.custId', 'customers.custId')
            ->leftJoin('users', 'active_conversations.empCode', 'users.empCode')
            ->leftJoin('chat_rooms', 'active_conversations.from_roomId', 'chat_rooms.roomId')
            ->where('rates.status', 'progress')
            ->where('active_conversations.empCode', auth()->user()->empCode)
            ->where('active_conversations.endTime', null)
            ->select(
                'chat_rooms.roomName',
                'customers.custName',
                'customers.avatar',
                'customers.description',
                'active_conversations.*',
                'rates.status',
                'users.name as empName',
                'rates.created_at as rate_created_at',
                'rates.updated_at as rate_updated_at'
            )
            ->orderBy('updated_at', 'asc')
            ->get();

        foreach ($result as $key => $value) {
            $latest_message = ChatHistory::query()->select('content', 'contentType', 'created_at')->where('custId', $value->custId)
                ->orderBy('id', 'desc')
                ->first();
            $value->latest_message = $latest_message;
        }
        return response()->json([
            'message' => 'myCase',
            'result' => $result
        ]);
    }

    private function TopEmployee()
    {
        $startOfDay = Carbon::now()->startOfDay(); // 2025-05-05 00:00:00
        $endOfDay = Carbon::now()->endOfDay();     // 2025-05-05 23:59:59
        $topEmployee = ActiveConversations::query()
            ->leftJoin('users', 'active_conversations.empCode', '=', 'users.empCode')
            ->select('users.name', 'users.avatar', DB::raw('COUNT(active_conversations.id) as count'))
            ->where('users.empCode', '!=', 'BOT')
            ->whereNotNull('active_conversations.empCode')
            ->whereBetween('active_conversations.created_at', [$startOfDay, $endOfDay])
            ->groupBy('users.name', 'users.avatar')
            ->orderByDesc('count')
            ->limit(10)
            ->get();


        return $topEmployee;
    }
}
