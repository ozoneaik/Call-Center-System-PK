<?php

namespace App\Http\Controllers;

use App\Http\Requests\selectMessageRequest;
use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\ChatRooms;
use App\Models\Customers;
use App\Models\Notes;
use App\Models\Rates;
use App\Models\TagMenu;
use App\Services\DashboardService;
use App\Services\DisplayService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

            $starList = Rates::query()->select('rate', 'updated_at')->where('custId', $custId)->orderBy('updated_at', 'desc')->get();

            $notes = Notes::query()->where('custId', $custId)->orderBy('created_at', 'desc')->get();

            $tags = TagMenu::all();

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

        //ดึงจำนวนแชทที่ค้าง
        $pendingChats = $this->dashboardService->pendingChats($today);

        return response()->json([
            'selectDate' => $today,
            'sevenDaysAgo' => $chatCounts,
            'customers' => $customers,
            'chatCounts' => $countChats,
            'stars' => $stars,
            'pendingChats' => $pendingChats
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

    public function ChatHistory(): JsonResponse
    {

        $list = ActiveConversations::query()
            ->select('active_conversations.*', 'customers.custName', 'customers.avatar', 'customers.description', 'users.name')
            ->join('customers', 'active_conversations.custId', '=', 'customers.custId')
            ->leftJoin('users', 'active_conversations.empCode', '=', 'users.empCode')
            ->distinct('active_conversations.custId')
            ->orderBy('active_conversations.custId')
            ->orderByDesc('active_conversations.updated_at')
            ->get();


        return response()->json([
            'list' => $list
        ]);
    }


    public function myCase()
    {
        $result = Rates::query()->leftJoin('active_conversations', 'active_conversations.rateRef', '=', 'rates.id')
            ->leftJoin('customers', 'rates.custId', 'customers.custId')
            ->leftJoin('users', 'active_conversations.empCode', 'users.empCode')
            ->leftJoin('chat_rooms', 'active_conversations.from_roomId', 'chat_rooms.roomId')
            ->where('rates.status', 'progress')
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
}
