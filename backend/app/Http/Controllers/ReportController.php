<?php

namespace App\Http\Controllers;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\ChatRooms;
use App\Models\Rates;
use App\Models\TagMenu;
use Carbon\Carbon;
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

    public function FullReport(Request $request)
    {
        $request->validate([
            'startTime' => 'required|date',
            'endTime' => 'required|date'
        ], [
            'startTime.required' => 'จำเป็นต้องระบุวันเริ่มต้น',
            'endTime.required' => 'จำเป็นต้องระบุวันสิ้นสุด'
        ]);

        $startTime = $request['startTime'] . ' 00:00:00';
        $endTime = $request['endTime'] . ' 23:59:59';
        $results = DB::table('active_conversations')
            ->leftJoin('users', 'users.empCode', '=', 'active_conversations.empCode')
            ->where('active_conversations.empCode', 'NOT LIKE', 'BOT')
            ->whereBetween('active_conversations.created_at', [$startTime, $endTime])
            ->groupBy('users.empCode')
            ->pluck('users.empCode');

        $list = [];
        $listFull = [];
        foreach ($results as $key => $empCode) {
            $listFull[$key]['empCode'] = $empCode;
            $halfHour = 0;
            $oneHour = 0;
            $overOneHour = 0;
            $overTwoHour = 0;
            $overDay = 0;
            $list[$key] = DB::table('active_conversations')
                ->leftJoin('users', 'users.empCode', '=', 'active_conversations.empCode')
                ->where('active_conversations.empCode', 'NOT LIKE', 'BOT')
                ->whereBetween('active_conversations.created_at', [$startTime, $endTime])
                ->where('active_conversations.empCode', 'LIKE', $empCode)
                ->select('users.name', 'active_conversations.totalTime')
                ->get();
            $listFull[$key]['totalCase'] = count($list[$key]);
            foreach ($list[$key] as $item) {
                if (empty($item->totalTime)) {
                    $item->totalTime = '0 ชั่วโมง 0 นาที 0 วินาที';
                }
                $totalTime = $item->totalTime;

                $day = 0;
                $hour = 0;
                $minute = 0;

                preg_match('/(\d+)\s*วัน/', $totalTime, $dayMatch);
                preg_match('/(\d+)\s*ชั่วโมง/', $totalTime, $hourMatch);
                preg_match('/(\d+)\s*นาที/', $totalTime, $minuteMatch);

                if (!empty($dayMatch)) {
                    $day = (int)$dayMatch[1];
                }
                if (!empty($hourMatch)) {
                    $hour = (int)$hourMatch[1];
                }
                if (!empty($minuteMatch)) {
                    $minute = (int)$minuteMatch[1];
                }
                $totalMinutes = ($day * 24 * 60) + ($hour * 60) + $minute;
                if ($totalMinutes <= 30) {
                    $halfHour++;
                } elseif ($totalMinutes > 30 && $totalMinutes <= 60) {
                    $oneHour++;
                } elseif ($totalMinutes > 60 && $totalMinutes <= 120) {
                    $overOneHour++;
                } elseif ($totalMinutes > 120 && $totalMinutes <= 1440) {
                    $overTwoHour++;
                } else {
                    $overDay++;
                }
            }
            $listFull[$key]['halfHour'] = $halfHour;
            $listFull[$key]['oneHour'] = $oneHour;
            $listFull[$key]['overOneHour'] = $overOneHour;
            $listFull[$key]['overTwoHour'] = $overTwoHour;
            $listFull[$key]['overDay'] = $overDay;
        }

        $starRate = DB::table('rates')->selectRaw('COUNT(rates.id) as count, rates.rate as starRate')
            ->whereBetween('rates.created_at', [$startTime, $endTime])
            ->groupBy('rates.rate')
            ->get();

        return response()->json([
            'GraphReceive' => 'graphReceive',
            'GraphStar' => 'graphStar',
            'Individual' => 'individual',
            'request' => $request->all(),
            'results' => $listFull,
            'starRate' => $starRate
        ]);
    }

    public function TagReport(Request $request){
        $request->validate([
            'startTime' => 'required|date',
            'endTime' => 'required|date'
        ], [
            'startTime.required' => 'จำเป็นต้องระบุวันเริ่มต้น',
            'endTime.required' => 'จำเป็นต้องระบุวันสิ้นสุด'
        ]);
        $startTime = $request['startTime'] . ' 00:00:00';
        $endTime = $request['endTime'] . ' 23:59:59';
        $results = DB::table('rates')
            ->leftJoin('tag_menus', 'tag_menus.id', '=', 'rates.tag')
            ->select(
                'tag_menus.id as tagId',
                'tag_menus.tagName',
                DB::raw('COUNT(rates.id) as count'),
            )
            ->whereBetween('rates.created_at', [
                $startTime,
                $endTime
            ])
            ->where('rates.status', 'success')
            ->groupBy(['tag_menus.id', 'tag_menus.tagName']) // เพิ่ม tagName ในการ group
            ->orderBy('tag_menus.id', 'asc')
            ->get();

        foreach ($results as $result) {
            $d = DB::table('rates')
                ->leftJoin('chat_rooms', 'chat_rooms.roomId', '=', 'rates.latestRoomId')
                ->select(
                    'rates.latestRoomId',
                    'chat_rooms.roomName',
                    DB::raw('COUNT(rates.id) AS count')
                )
                ->whereBetween('rates.created_at', [$startTime, $endTime])
                ->where('rates.tag', $result->tagId)
                ->groupBy('rates.latestRoomId', 'chat_rooms.roomName')
                ->get();
            $result->detail = $d;
        }
        return response()->json([
            'tagReports' => $results,
            'startTime' => $startTime,
            'endTime' => $endTime,
        ]);
    }
}
