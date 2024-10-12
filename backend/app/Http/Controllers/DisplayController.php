<?php

namespace App\Http\Controllers;

use App\Http\Requests\selectMessageRequest;
use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\ChatRooms;
use App\Models\Customers;
use App\Models\Notes;
use App\Models\Rates;
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

    public function selectMessage($custId,selectMessageRequest $request): JsonResponse
    {
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $list = $this->displayService->selectMessage($custId);
            if (!$list) throw new \Exception('เกิดปัญหาในการ query select');
            if ($list->isEmpty()) throw new \Exception('ไม่พบรายการ Chat');
            $sender = Customers::where('custId',$custId)->first();
            if (!$sender) throw new \Exception('ไม่พบ sender');
            $emp = $this->displayService->getEmpReply($request['activeId']);
            $room = ActiveConversations::where('id', $request['activeId'])->first();
            $room = ChatRooms::where('roomId', $room['roomId'])->first();
            if (!$emp) throw new \Exception('ไม่พบ พนักงานที่รับเรื่อง');
            $sender['emp'] = $emp;

            $starList = Rates::select('rate','updated_at')->where('custId',$custId)->orderBy('updated_at','desc')->get();

            $notes = $notes = Notes::where('custId', $custId)->orderBy('created_at','desc')->get();

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
        $stars['total'] = Rates::whereDate('created_at',$today)->sum('rate');

        //ดึงจำนวนแชทวันนี้
        $countChats['rooms'] = $this->dashboardService->countChat($today);
        $countChats['total'] = ChatHistory::whereDate('created_at',$today)->count('id');

        return response()->json([
            'selectDate' => $today,
            'sevenDaysAgo' => $chatCounts,
            'customers' => $customers,
            'chatCounts' => $countChats,
            'stars' => $stars,
        ]);
    }
}
