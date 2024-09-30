<?php

namespace App\Http\Controllers;

use App\Http\Requests\selectMessageRequest;
use App\Models\Customers;
use App\Services\DisplayService;
use Illuminate\Http\JsonResponse;

class DisplayController extends Controller
{
    protected DisplayService $displayService;

    public function __construct(DisplayService $displayService)
    {
        $this->displayService = $displayService;
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
            if (!$emp) throw new \Exception('ไม่พบ พนักงานที่รับเรื่อง');
            $sender['emp'] = $emp;
            $message = 'ดึงข้อมูลสำเร็จ';
            $status = 200;
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail' => $detail,
                'rateId' => $request['rateId'],
                'activeId' => $request['activeId'],
                'sender' => $sender ?? [],
                'custId' => $custId,
                'list' => $list ?? []
            ], $status ?? 400);
        }

    }

}
