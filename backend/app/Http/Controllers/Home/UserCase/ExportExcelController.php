<?php

namespace App\Http\Controllers\Home\UserCase;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportExcelController extends Controller
{
    private function humanizeSeconds(?int $secs): string
    {
        $s = max(0, (int)($secs ?? 0));
        $d = intdiv($s, 86400);
        $s %= 86400;
        $h = intdiv($s, 3600);
        $s %= 3600;
        $m = intdiv($s, 60);
        $s %= 60;

        $parts = [];
        if ($d) $parts[] = "{$d} วัน";
        if ($h || $d) $parts[] = "{$h} ชั่วโมง";
        if ($m || $d || $h) $parts[] = "{$m} นาที";
        $parts[] = "{$s} วินาที";
        return implode(' ', $parts);
    }

    // แสดงครบทุกหน่วยเสมอ
    private function humanizeSecondsFull(?int $secs): string
    {
        $s = max(0, (int)($secs ?? 0));
        $d = intdiv($s, 86400);
        $s %= 86400;
        $h = intdiv($s, 3600);
        $s %= 3600;
        $m = intdiv($s, 60);
        $s = $s % 60;
        return "{$d} วัน {$h} ชั่วโมง {$m} นาที {$s} วินาที";
    }

    private function bucketCloseMinutes(?float $mins): string
    {
        if ($mins === null) return '-';
        $m = max(0, (float)$mins);
        if ($m >= 1440) return 'มากกว่า 1 วัน';
        if ($m >= 60)   return 'มากกว่า 1 ชั่วโมง';
        if ($m >= 10)   return 'มากกว่า 10 นาที';
        if ($m >= 5)    return 'มากกว่า 5 นาที';
        if ($m >= 1)    return 'มากกว่า 1 นาที';
        return 'ภายใน 1 นาที';
    }

    public function exportDetailedCasesRangeExcel(Request $request): StreamedResponse
    {
        $startDate = $request->query('start_date');
        $endDate   = $request->query('end_date', $startDate);

        if (!$startDate) {
            return response()->streamDownload(fn() => print 'start_date is required', 'error.txt');
        }

        $start = Carbon::parse($startDate)->startOfDay();
        $end   = Carbon::parse($endDate)->endOfDay();

        $platformId = $request->query('platform_id');
        $dept       = $request->query('dept');
        $empCode    = $request->query('empCode');

        // 1) main cases
        $mainQuery = DB::connection('pgsql_real')->table('rates')
            ->where('rates.status', 'success')
            ->leftJoin('customers', 'customers.custId', '=', 'rates.custId')
            ->leftJoin('tag_menus', 'rates.tag', '=', 'tag_menus.id')
            ->leftJoin('chat_rooms', 'chat_rooms.roomId', '=', 'rates.latestRoomId')
            ->whereBetween('rates.created_at', [$start, $end])
            ->select(
                'rates.*',
                'customers.custName',
                'tag_menus.tagName',
                DB::raw('chat_rooms."roomName" as "latestRoomName"')
            )
            ->orderBy('rates.id', 'desc');

        if ($platformId) {
            $mainQuery->leftJoin('platform_access_tokens as pat_pf', 'pat_pf.id', '=', 'customers.platformRef')
                ->where('pat_pf.id', $platformId);
        }

        $mainCases = $mainQuery->get();
        $rateIds   = $mainCases->pluck('id')->toArray();

        // --- Expressions ---
        // วินาทีจาก "วันรับเรื่อง - วันที่สร้างของเคสหลัก"
        $secsExpr = 'GREATEST(EXTRACT(EPOCH FROM (COALESCE(ac."startTime", ac."receiveAt") - r."created_at")), 0)';

        // 2) sub cases (คำนวณ accept_hhmmss + close_minutes ใน SQL)
        $subCases = DB::connection('pgsql_real')->table('active_conversations as ac')
            ->join('rates as r', 'r.id', '=', 'ac.rateRef')
            ->leftJoin('users', 'users.empCode', '=', 'ac.empCode')
            ->leftJoin('users as from_emp', 'from_emp.empCode', '=', 'ac.from_empCode')
            ->leftJoin('chat_rooms', 'chat_rooms.roomId', '=', 'ac.roomId')
            ->leftJoin('chat_rooms as from_chat_room', 'from_chat_room.roomId', '=', 'ac.from_roomId')
            ->when($dept, fn($q) => $q->leftJoin('users as u_f', 'u_f.empCode', '=', 'ac.empCode')->where('u_f.description', $dept))
            ->when($empCode, fn($q) => $q->where('ac.empCode', $empCode))
            ->whereIn('ac.rateRef', $rateIds)
            ->select(
                'ac.*',
                'users.name as empName',
                'from_emp.name as from_empName',
                DB::raw('chat_rooms."roomName" as "roomName"'),
                DB::raw('from_chat_room."roomName" as "from_roomName"'),

                // วันรับเรื่อง
                DB::raw('COALESCE(ac."startTime", ac."receiveAt") as accepted_at'),

                // ระยะเวลาการรับงาน (ข้อความ) = secsExpr แตกเป็น วัน/ชม./นาที/วินาที
                DB::raw(
                    "FLOOR(($secsExpr)/86400)::int || ' วัน ' || " .
                    "FLOOR(MOD(($secsExpr), 86400)/3600)::int || ' ชั่วโมง ' || " .
                    "FLOOR(MOD(($secsExpr), 3600)/60)::int || ' นาที ' || " .
                    "FLOOR(MOD(($secsExpr), 60))::int || ' วินาที' as accept_hhmmss"
                ),

                // ช่วงเวลาการปิดเคส (นาที) = FLOOR(secsExpr/60)  เทียบเท่า =(วันรับเรื่อง-วันที่สร้าง)*1440
                DB::raw("FLOOR(($secsExpr) / 60)::int as close_minutes")
            )
            ->get()
            ->groupBy('rateRef');

        // 3) compute & tag
        foreach ($mainCases as $k => $rate) {
            $current = $subCases->get($rate->id, collect());
            $totalH = 0; $totalM = 0; $totalS = 0;

            if ($current->isNotEmpty()) {
                $latestSubId = $current->max('id');

                foreach ($current as $idx => $sub) {
                    // รวมเวลาย่อย (คงสูตรเดิมสำหรับ totalTime)
                    $h = $m = $s = 0;
                    if (!empty($sub->totalTime)) {
                        preg_match('/(\d+)\s*ชั่วโมง/u', $sub->totalTime, $m1);
                        preg_match('/(\d+)\s*นาที/u',   $sub->totalTime, $m2);
                        preg_match('/(\d+)\s*วินาที/u', $sub->totalTime, $m3);
                        $h = $m1[1] ?? 0;
                        $m = $m2[1] ?? 0;
                        $s = $m3[1] ?? 0;
                    } elseif (!empty($sub->endTime) && !empty($sub->startTime)) {
                        $secs = Carbon::parse($sub->endTime)->diffInSeconds(Carbon::parse($sub->startTime), false);
                        $secs = max(0, $secs);
                        $h = intdiv($secs, 3600);
                        $secs %= 3600;
                        $m = intdiv($secs, 60);
                        $s = $secs % 60;
                    }

                    $totalH += (int)$h;
                    $totalM += (int)$m;
                    $totalS += (int)$s;

                    // tag เคสย่อย (อันล่าสุดคือแท็กจบ)
                    $current[$idx]->tagName = ($sub->id == $latestSubId) ? ($rate->tagName ?? 'ไม่ระบุแท็ก') : 'ส่งต่อ';

                    // ใช้ close_minutes จาก SQL โดยตรง + คิด bucket
                    $current[$idx]->close_minutes = isset($sub->close_minutes) ? (int)$sub->close_minutes : 0;
                    $current[$idx]->close_bucket  = $this->bucketCloseMinutes($current[$idx]->close_minutes);

                    if (empty($sub->totalTime)) {
                        $current[$idx]->totalTime = $this->humanizeSeconds(($h * 3600) + ($m * 60) + $s);
                    }
                }
            }

            // รวมเวลาทั้งหมดระดับเคสหลัก
            $totalM += intdiv($totalS, 60);
            $totalS = $totalS % 60;
            $totalH += intdiv($totalM, 60);
            $totalM = $totalM % 60;

            $rate->totalTime = "{$totalH} ชั่วโมง {$totalM} นาที {$totalS} วินาที";
            $rate->sub_case  = $current;
        }

        // 4) export
        $headers = [
            'ID เคสหลัก',
            'ชื่อลูกค้า',
            'สถานะ',
            'หมายเลขแท็ก',
            'แท็คการจบสนทนา',
            'เวลารวม',
            'จบการสนทนาเมื่อ',
            'จำนวนเคสย่อย',
            'ID เคสย่อย',
            'Tag เคสย่อย',
            'พนักงานที่รับเรื่อง',
            'ห้องที่รับเรื่อง',
            'จากพนักงาน',
            'จากห้อง',
            'วันที่สร้าง',
            'วันรับเรื่อง',
            'ระยะเวลาการรับงาน',
            'ช่วงเวลาการปิดเคส (นาที)',
            'ปิดเคสภายใน',
            'จบการสนทนาเมื่อ',
            'เวลาสนทนาทั้งหมด (เคสย่อย)'
        ];

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('DetailedCases');
        $sheet->fromArray($headers, null, 'A1');
        $sheet->getStyle('A1:U1')->getFont()->setBold(true);

        $r = 2;
        foreach ($mainCases as $rate) {
            $subs = $rate->sub_case;

            if ($subs && $subs->isNotEmpty()) {
                foreach ($subs as $sc) {
                    $sheet->fromArray([[
                        // main
                        $rate->id,
                        $rate->custName ?? $rate->custId,
                        $rate->status,
                        $rate->tag ?? '',
                        $rate->tagName ?? 'ไม่ระบุแท็ก',
                        $rate->totalTime,
                        $rate->created_at ? Carbon::parse($rate->created_at)->format('Y-m-d H:i:s') : null,
                        // sub
                        $subs->count(),
                        $sc->id,
                        $sc->tagName,
                        $sc->empName,
                        $sc->roomName,
                        $sc->from_empName,
                        $sc->from_roomName,
                        $sc->created_at ? Carbon::parse($sc->created_at)->format('Y-m-d H:i:s') : null, // วันที่สร้าง (sub)
                        $sc->accepted_at ? Carbon::parse($sc->accepted_at)->format('Y-m-d H:i:s') : null, // วันรับเรื่อง
                        $sc->accept_hhmmss,                                                                   // ระยะเวลาการรับงาน (ข้อความ)
                        $sc->close_minutes,                                                                    // นาที (int) = INT((accepted-created)*1440)
                        $sc->close_bucket,                                                                     // ปิดเคสภายใน (bucket)
                        $sc->endTime ? Carbon::parse($sc->endTime)->format('Y-m-d H:i:s') : null,             // จบการสนทนาเมื่อ
                        $sc->totalTime ?? '',
                    ]], null, "A{$r}");
                    $r++;
                }
            } else {
                $sheet->fromArray([[
                    $rate->id,
                    $rate->custName ?? $rate->custId,
                    $rate->status,
                    $rate->tag ?? '',
                    $rate->tagName ?? 'ไม่ระบุแท็ก',
                    $rate->totalTime,
                    $rate->created_at ? Carbon::parse($rate->created_at)->format('Y-m-d H:i:s') : null,

                    0,
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    $rate->created_at ? Carbon::parse($rate->created_at)->format('Y-m-d H:i:s') : null,
                    '',
                    '',
                    '',
                    '',
                ]], null, "A{$r}");
                $r++;
            }
        }

        foreach (range('A', 'U') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'DetailedCases_' . $start->format('Ymd') . '-' . $end->format('Ymd') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        return response()->streamDownload(
            fn() => $writer->save('php://output'),
            $filename,
            ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        );
    }
}
