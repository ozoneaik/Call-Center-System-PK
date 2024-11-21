<?php

namespace App\Http\Controllers;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\ChatRooms;
use App\Models\Rates;
use App\Models\TagMenu;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function LineList(Request $request): JsonResponse
    {
        $request->validate([
            'startTime' => 'required|date',
            'endTime' => 'required|date'
        ], [
            'startTime.required' => 'จำเป็นต้องระบุวันเริ่มต้น',
            'endTime.required' => 'จำเป็นต้องระบุวันสิ้นสุด'
        ]);
        // ตรวจสอบว่าวันที่เริ่มต้นต้องน้อยกว่าหรือเท่ากับวันที่สิ้นสุด
        if ($request['startTime'] > $request['endTime']) {
            return response()->json([
                'message' => 'error',
                'detail' => 'วันเริ่มต้นต้องน้อยกว่าหรือเท่ากับวันสิ้นสุด'
            ], 422);
        }

        $startTime = $request['startTime'] . ' 00:00:00';
        $endTime = $request['endTime'] . ' 23:59:59';
        $result = DB::table('rates')
            ->select([
                'customers.platformRef',
                'platform_access_tokens.description',
                DB::raw('COUNT(*) AS countCase'),
                DB::raw("COUNT(CASE WHEN rates.status = 'success' THEN 1 END) AS endCase"),
                DB::raw("COUNT(CASE WHEN rates.status != 'success' OR rates.status IS NULL THEN 1 END) AS pendingCase")
            ])
            ->leftJoin('customers', 'customers.custId', '=', 'rates.custId')
            ->leftJoin('platform_access_tokens', 'platform_access_tokens.id', '=', 'customers.platformRef')
            ->whereBetween(DB::raw('DATE(rates.created_at)'), [$startTime, $endTime])
            ->groupBy('customers.platformRef', 'platform_access_tokens.description')
            ->get();
        return response()->json([
            'message' => 'report',
            'lineList' => $result,
            'detail' => 'รายงานรายชื่อลูกค้าที่ใช้บริการในช่วงเวลาที่กำหนด',
            'request' => $request->all(),
        ]);
    }

    public function RateList(Request $request)
    {
        $request->validate([
            'startTime' => 'required|date',
            'endTime' => 'required|date',
            'lineDescription' => 'required'
        ], [
            'startTime.required' => 'จำเป็นต้องระบุวันเริ่มต้น',
            'endTime.required' => 'จำเป็นต้องระบุวันสิ้นสุด',
            'lineDescription.required' => 'จำเป็นต้องระบุ lineDescription'
        ]);

        // ตรวจสอบว่าวันที่เริ่มต้นต้องน้อยกว่าหรือเท่ากับวันที่สิ้นสุด
        if ($request['startTime'] > $request['endTime']) {
            return response()->json([
                'message' => 'error',
                'detail' => 'วันเริ่มต้นต้องน้อยกว่าหรือเท่ากับวันสิ้นสุด'
            ], 422);
        }
        $startTime = $request['startTime'] . ' 00:00:00';
        $endTime = $request['endTime'] . ' 23:59:59';
        $lineDescription = $request['lineDescription'];
        $result = DB::table('rates')
            ->select([
                'rates.*',
                DB::raw("COALESCE(CAST(rates.tag AS TEXT), 'ยังไม่จบการสนทนา') AS tag"),
                'customers.platformRef',
                'customers.custName',
                'platform_access_tokens.description',
                DB::raw("COALESCE(CAST(\"tag_menus\".\"tagName\" AS TEXT), 'ยังไม่จบการสนทนา') AS T_menu")
            ])
            ->leftJoin('customers', 'customers.custId', '=', 'rates.custId')
            ->leftJoin('platform_access_tokens', 'platform_access_tokens.id', '=', 'customers.platformRef')
            ->leftJoin('tag_menus', 'rates.tag', '=', 'tag_menus.id')
            ->whereBetween(DB::raw('DATE(rates.created_at)'), [$startTime, $endTime])
            ->where('platform_access_tokens.description', 'LIKE', $lineDescription)
            ->get();

        return response()->json([
            'message' => 'report',
            'rateList' => $result,
            'detail' => 'rateList',
            'request' => $request->all(),
        ]);
    }

    public function activeList(Request $request)
    {


        $request->validate([
            'rateId' => 'required'
        ], [
            'rateId.required' => 'จำเป็นต้องระบุ rateId'
        ]);
        $rateId = $request['rateId'];

        $result = DB::table('rates')
            ->select([
                'rates.id',
                'active_conversations.id as activeId',
                'customers.custName',
                'chat_rooms.roomName',
                'chat_rooms.roomId',
                'active_conversations.receiveAt',
                'active_conversations.startTime',
                'active_conversations.endTime',
                'active_conversations.totalTime',
                'active_conversations.from_empCode',
                'active_conversations.from_roomId',
                'active_conversations.empCode',
                'tag_menus.tagName',
                'rates.rate'
            ])
            ->leftJoin('active_conversations', 'rates.id', '=', 'active_conversations.rateRef')
            ->leftJoin('customers', 'rates.custId', '=', 'customers.custId')
            ->leftJoin('chat_rooms', 'active_conversations.roomId', '=', 'chat_rooms.roomId')
            ->leftJoin('tag_menus', 'rates.tag', '=', 'tag_menus.id')
            ->where('rates.id', $rateId)
            ->orderBy('active_conversations.created_at', 'asc')
            ->get();


        // ฟังก์ชันแปลงเวลาเป็นวินาที
        function timeToSeconds($timeString)
        {
            preg_match('/(\d+) ชั่วโมง (\d+) นาที (\d+) วินาที/', $timeString, $matches);
            $hours = isset($matches[1]) ? (int)$matches[1] : 0;
            $minutes = isset($matches[2]) ? (int)$matches[2] : 0;
            $seconds = isset($matches[3]) ? (int)$matches[3] : 0;

            return ($hours * 3600) + ($minutes * 60) + $seconds;
        }

        // ฟังก์ชันแปลงวินาทีกลับเป็นรูปแบบเวลา
        function secondsToTime($totalSeconds)
        {
            $hours = floor($totalSeconds / 3600);
            $minutes = floor(($totalSeconds % 3600) / 60);
            $seconds = $totalSeconds % 60;

            return "{$hours} ชั่วโมง {$minutes} นาที {$seconds} วินาที";
        }

        // คำนวณผลรวมของเวลา
        $totalSeconds = 0;
        $totalChat = 0;
        foreach ($result as $row) {
            $totalSeconds += timeToSeconds($row->totalTime);
            $row->amount_chat = count(ChatHistory::query()->where('conversationRef', $row->activeId)->get());
            $totalChat += $row->amount_chat;
        }
        $totalTimeFormatted = secondsToTime($totalSeconds);


        return response()->json([
            'custName' => $result[0]->custName,
            'message' => 'report',
            'totalTimeInSeconds' => $totalTimeFormatted,
            'activeList' => $result,
            'detail' => 'rateList',
            'totalChat' => $totalChat,
            'request' => $request->all(),
        ]);
    }

    public function reportDepartment(Request $request)
    {
        $startTime = $request['startTime'] . ' 00:00:00';
        $endTime = $request['endTime'] . ' 23:59:59';
        $tagMenus = TagMenu::select('id', 'tagName')->get();
        $chatRooms = ChatRooms::query()->select('roomId', 'roomName')->get();
        $rateList = Rates::query()->where('created_at', '>=', $startTime)
            ->where('created_at', '<=', $endTime)
            ->get();

        $P =  DB::table('tag_menus')
            ->select([
                'tag_menus.tagName',
                'tag_menus.id',
                DB::raw('COUNT(rates.id) as count')
            ])
            ->leftJoin('rates', function ($join) {
                $join->on('tag_menus.id', '=', 'rates.tag')
                    ->whereBetween('rates.created_at', ['2024-11-14 00:00:00', '2024-11-14 23:59:59'])
                    ->where('rates.status', '=', 'success')
                    ->where('rates.latestRoomId', 'LIKE', 'ROOM01');
            })
            ->groupBy('tag_menus.tagName', 'tag_menus.id')
            ->orderBy('tag_menus.tagName')
            ->get();



        foreach ($P as $key => $p) {
            $halfHour = 0;
            $oneHour = 0;
            $overOneHour = 0;
            $overTwoHour = 0;
            $overDay = 0;
            $p->R = Rates::query()->where('tag', $p->id)
                ->whereBetween('rates.created_at', ['2024-11-14 00:00:00', '2024-11-14 23:59:59'])
                ->where('rates.status', '=', 'success')
                ->where('rates.latestRoomId', 'LIKE', 'ROOM01')
                ->get();
            foreach ($p->R as $rey => $r) {
                $p->R[$rey]->A = ActiveConversations::query()->select('totalTime')->where('rateRef', $r->id)->get(); // [0: 'totalTime' => '1 ชั่วโมง 2 นาที 3 วินาที', 1: 'totalTime' => '1 ชั่วโมง 2 นาที 3 วินาที']
                // หาผลรวมของเวลาทั้งหมด เก็บใส่ในตัวแปล $p->R[$ray]->totalTime

                $totalSeconds = 0;
                foreach ($p->R[$rey]->A as $active) {
                    $time = $active->totalTime; // เช่น "1 ชั่วโมง 2 นาที 3 วินาที"

                    // แยกข้อมูลเวลา
                    $hours = (preg_match('/(\d+)\s*ชั่วโมง/', $time, $matches) ? $matches[1] : 0);
                    $minutes = (preg_match('/(\d+)\s*นาที/', $time, $matches) ? $matches[1] : 0);
                    $seconds = (preg_match('/(\d+)\s*วินาที/', $time, $matches) ? $matches[1] : 0);

                    // คำนวณเวลารวมเป็นวินาที
                    $totalSeconds += ($hours * 3600) + ($minutes * 60) + $seconds;
                }

                // แปลงเวลารวมจากวินาทีกลับไปเป็นรูปแบบที่ต้องการ
                $hours = floor($totalSeconds / 3600);
                $minutes = floor(($totalSeconds % 3600) / 60);
                $seconds = $totalSeconds % 60;

                $p->R[$rey]->totalTime = "{$hours} ชั่วโมง {$minutes} นาที {$seconds} วินาที";
                if (($hours == 0) && ($minutes <= 30)) {
                    $halfHour++;
                } elseif (($hours == 1) && ($minutes <= 30)) {
                    $oneHour++;
                } elseif (($hours > 1) && ($hours < 2)) {
                    $overOneHour++;
                } elseif (($hours >= 2) && ($hours < 24)) {
                    $overTwoHour++;
                } else {
                    $overDay++;
                }
            }
            $p->halfHour = $halfHour;
            $p->oneHour = $oneHour;
            $p->overOneHour = $overOneHour;
            $p->overTwoHour = $overTwoHour;
            $p->overDay = $overDay;
        }
        return response()->json([
            'message' => 'test',
            'detail' => 'test',
            'tagMenus' => $tagMenus,
            'startTime' => $startTime,
            'endTime' => $endTime,
            'rateList' => $rateList,
            'chatRooms' => $chatRooms,
            'P' => $P
        ]);
    }
}
