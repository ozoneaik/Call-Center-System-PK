<?php

namespace App\Http\Controllers;

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
        foreach ($result as $row) {
            $totalSeconds += timeToSeconds($row->totalTime);
        }
        $totalTimeFormatted = secondsToTime($totalSeconds);


        return response()->json([
            'custName' => $result[0]->custName,
            'message' => 'report',
            'totalTimeInSeconds' => $totalTimeFormatted,
            'activeList' => $result,
            'detail' => 'rateList',
            'request' => $request->all(),
        ]);
    }
}
