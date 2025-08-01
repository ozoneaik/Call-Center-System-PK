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
            $fiveMinutes = 0;
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
                if ($totalMinutes <= 5) {
                    $fiveMinutes++;
                } elseif ($totalMinutes <= 30) {
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
            $listFull[$key]['empName'] = $item->name;
            $listFull[$key]['fiveMinutes'] = $fiveMinutes;
            $listFull[$key]['halfHour'] = $halfHour;
            $listFull[$key]['oneHour'] = $oneHour;
            $listFull[$key]['overOneHour'] = $overOneHour;
            $listFull[$key]['overTwoHour'] = $overTwoHour;
            $listFull[$key]['overDay'] = $overDay;
            $listFull[$key]['total'] = $fiveMinutes + $halfHour + $oneHour + $overOneHour + $overTwoHour + $overDay;
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

    public function TagReport(Request $request)
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











    public function index(Request $request)
    {
        if (isset($request['export'])) {
            $export = 'excel';
        } else {
            $export = null;
        }
        // ดึงข้อมูลเคสหลักที่มีสถานะ success ในช่วงเดือนกรกฎาคม 2025
        $main_case = DB::connection('pgsql_sub')->table('rates')
            ->where('rates.status', 'success')
            ->leftJoin('customers', 'customers.custId', '=', 'rates.custId')
            ->leftJoin('tag_menus', 'rates.tag', '=', 'tag_menus.id')
            ->leftJoin('chat_rooms', 'chat_rooms.roomId', '=', 'rates.latestRoomId')
            ->whereBetween('rates.created_at', ['2025-07-01 00:00:00', '2025-07-31 23:59:59'])
            ->select('rates.*', 'customers.custName', 'tag_menus.tagName', 'chat_rooms.roomName as latestRoomName')
            ->orderBy('id', 'desc')
            ->get();

        // ดึง rate_id ทั้งหมดมาใช้ในการ query เคสย่อย
        $rate_ids = $main_case->pluck('id')->toArray();

        // ดึงข้อมูลเคสย่อยทั้งหมดที่เกี่ยวข้องในครั้งเดียว
        $sub_cases = DB::connection('pgsql_sub')->table('active_conversations')
            ->leftJoin('users', 'users.empCode', '=', 'active_conversations.empCode')
            ->leftJoin('users as from_emp', 'from_emp.empCode', '=', 'active_conversations.from_empCode')
            ->leftJoin('chat_rooms', 'chat_rooms.roomId', '=', 'active_conversations.roomId')
            ->leftJoin('chat_rooms as from_chat_room', 'from_chat_room.roomId', '=', 'active_conversations.from_roomId')
            ->whereIn('active_conversations.rateRef', $rate_ids)
            ->select(
                'active_conversations.*',
                'users.name as empName',
                'from_emp.name as from_empName',
                'chat_rooms.roomName as roomName',
                'from_chat_room.roomName as from_roomName'
            )
            ->get()
            ->groupBy('rateRef'); // จัดกลุ่มตาม rateRef เพื่อให้ง่ายต่อการแมป

        // แมปเคสย่อยกับเคสหลักและเพิ่ม tag
        foreach ($main_case as $key => $rate) {
            $current_sub_cases = $sub_cases->get($rate->id, collect()); // ดึงเคสย่อยของเคสหลักนี้

            // ตัวแปรสำหรับเก็บเวลารวม
            $total_hours = 0;
            $total_minutes = 0;
            $total_seconds = 0;

            if ($current_sub_cases->isNotEmpty()) {
                // หาเคสย่อยล่าสุด (id มากสุด)
                $latest_sub_case_id = $current_sub_cases->max('id');

                // เพิ่ม tag ให้กับเคสย่อยแต่ละตัวและคำนวณเวลารวม
                foreach ($current_sub_cases as $sub_key => $sub_case) {
                    // คำนวณเวลาจาก totalTime
                    if (!empty($sub_case->totalTime)) {
                        // แยกเวลาออกจากสตริง เช่น "0 ชั่วโมง 2 นาที 1 วินาที"
                        preg_match('/(\d+) ชั่วโมง/', $sub_case->totalTime, $hours_match);
                        preg_match('/(\d+) นาที/', $sub_case->totalTime, $minutes_match);
                        preg_match('/(\d+) วินาที/', $sub_case->totalTime, $seconds_match);

                        $total_hours += isset($hours_match[1]) ? (int)$hours_match[1] : 0;
                        $total_minutes += isset($minutes_match[1]) ? (int)$minutes_match[1] : 0;
                        $total_seconds += isset($seconds_match[1]) ? (int)$seconds_match[1] : 0;
                    }

                    if ($sub_case->id == $latest_sub_case_id) {
                        // เคสย่อยล่าสุด ใช้ tag เดียวกับเคสหลัก
                        $current_sub_cases[$sub_key]->tagName = $rate->tagName;
                    } else {
                        // เคสย่อยอื่นๆ ใช้ tag เป็น "ส่งต่อ"
                        $current_sub_cases[$sub_key]->tagName = 'ส่งต่อ';
                    }
                }
            }

            // แปลงเวลาให้ถูกต้อง (60 วินาที = 1 นาที, 60 นาที = 1 ชั่วโมง)
            $total_minutes += floor($total_seconds / 60);
            $total_seconds = $total_seconds % 60;
            $total_hours += floor($total_minutes / 60);
            $total_minutes = $total_minutes % 60;

            // สร้าง totalTime string สำหรับเคสหลัก
            $main_case[$key]->totalTime = $total_hours . ' ชั่วโมง ' . $total_minutes . ' นาที ' . $total_seconds . ' วินาที';
            $main_case[$key]->sub_case = $current_sub_cases;
        }

        // ถ้าต้องการ export Excel
        if ($export === 'excel') {
            return $this->exportToExcel($main_case);
        }

        return response()->json([
            'message' => 'report',
            'detail' => 'รายงานทั้งหมด',
            'count_rate_success' => count($main_case),
            'cases' => $main_case,
        ]);
    }

    private function exportToExcel($main_case)
    {
        // สร้างข้อมูลสำหรับ Excel
        $excel_data = [];

        // หัวตาราง
        $excel_data[] = [
            'ID เคสหลัก',
            'ชื่อลูกค้า',
            'สถานะ',
            'หมายเลขแท็ก',
            'แท็คการจบสนทนา',
            'เวลารวม',
            'จบสนทนาเมื่อ',
            'จำนวนเคสย่อย',
            'ID เคสย่อย',
            'Tag เคสย่อย',
            'พนักงานที่รับเรื่อง',
            'ห้องที่รับเรื่อง',
            'จากพนักงาน',
            'จากห้อง',
            'วันที่สร้าง',
            'รับเรื่อง/สนทนาเมื่อ',
            'จบสนทนาเมื่อ',
            'เวลาสนทนาทั้งหมดเคสย่อย'
        ];

        foreach ($main_case as $rate) {
            if ($rate->sub_case->isNotEmpty()) {
                // ถ้ามีเคสย่อย แสดงแต่ละเคสย่อย
                foreach ($rate->sub_case as $sub_case) {
                    $excel_data[] = [
                        $rate->id,
                        $rate->custName,
                        $rate->status,
                        $rate->tag ?? '',
                        $rate->tagName,
                        $rate->totalTime,
                        $rate->created_at,
                        count($rate->sub_case),
                        $sub_case->id,
                        $sub_case->tagName,
                        $sub_case->empName,
                        $sub_case->roomName,
                        $sub_case->from_empName,
                        $sub_case->from_roomName,
                        $sub_case->created_at,
                        $sub_case->startTime,
                        $sub_case->endTime,
                        $sub_case->totalTime ?? ''
                    ];
                }
            } else {
                // ถ้าไม่มีเคสย่อย แสดงเฉพาะเคสหลัก
                $excel_data[] = [
                    $rate->id,
                    $rate->status,
                    $rate->tag ?? '',
                    $rate->totalTime,
                    $rate->created_at,
                    0,
                    '',
                    '',
                    ''
                ];
            }
        }

        // สร้างไฟล์ Excel
        $filename = 'report_' . date('Y-m-d_H-i-s') . '.xlsx';

        // ใช้ PhpSpreadsheet
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // เขียนข้อมูลลงใน sheet
        $row = 1;
        foreach ($excel_data as $data) {
            $col = 'A';
            foreach ($data as $value) {
                $sheet->setCellValue($col . $row, $value);
                $col++;
            }
            $row++;
        }

        // จัดรูปแบบหัวตาราง
        $sheet->getStyle('A1:R1')->getFont()->setBold(true);
        $sheet->getStyle('A1:R1')->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID);
        $sheet->getStyle('A1:R1')->getFill()->getStartColor()->setARGB('FFCCCCCC');

        // ปรับขนาดคอลัมน์อัตโนมัติ
        foreach (range('A', 'R') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // สร้าง response สำหรับดาวน์โหลด
        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ]);
    }
}
