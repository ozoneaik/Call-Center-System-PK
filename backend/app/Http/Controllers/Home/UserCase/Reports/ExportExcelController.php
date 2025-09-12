<?php

namespace App\Http\Controllers\Home\UserCase\Reports;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
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
        @set_time_limit(300);
        @ini_set('memory_limit', '1024M');

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

        $statusesWant = ['success', 'pending', 'progress'];
        $wantSuccess  = in_array('success', $statusesWant, true);
        $wantPending  = in_array('pending', $statusesWant, true);
        $wantProgress = in_array('progress', $statusesWant, true);

        $closedExists = function ($q) use ($start, $end, $dept, $empCode, $platformId) {
            $q->select(DB::raw(1))
                ->from('active_conversations as ac')
                ->whereColumn('ac.rateRef', 'rates.id')
                ->whereNotNull('ac.endTime')
                ->whereBetween('ac.endTime', [$start, $end])
                ->whereNotIn('ac.empCode', ['BOT', 'adminIT']);

            if ($dept)    $q->join('users as u_f', 'u_f.empCode', '=', 'ac.empCode')->where('u_f.description', $dept);
            if ($empCode) $q->where('ac.empCode', $empCode);
            if ($platformId) {
                $q->join('rates as r2', 'r2.id', '=', 'ac.rateRef')
                    ->join('customers as c_pf', 'c_pf.custId', '=', 'r2.custId')
                    ->where('c_pf.platformRef', $platformId);
            }
        };

        $acceptedExistsStrict = function ($q) use ($start, $end, $dept, $empCode, $platformId) {
            $q->select(DB::raw(1))
                ->from('active_conversations as ac')
                ->whereColumn('ac.rateRef', 'rates.id')
                ->whereBetween(DB::raw('ac."receiveAt"'), [$start, $end])
                ->whereNotIn('ac.empCode', ['BOT', 'adminIT']);

            if ($dept)    $q->join('users as u_f', 'u_f.empCode', '=', 'ac.empCode')->where('u_f.description', $dept);
            if ($empCode) $q->where('ac.empCode', $empCode);
            if ($platformId) {
                $q->join('rates as r2', 'r2.id', '=', 'ac.rateRef')
                    ->join('customers as c_pf', 'c_pf.custId', '=', 'r2.custId')
                    ->where('c_pf.platformRef', $platformId);
            }
        };

        $mainQuery = DB::connection('pgsql_real')->table('rates')
            ->leftJoin('customers', 'customers.custId', '=', 'rates.custId')
            ->leftJoin('tag_menus', 'rates.tag', '=', 'tag_menus.id')
            ->leftJoin('tag_groups', 'tag_groups.group_id', '=', 'tag_menus.group_id')
            ->leftJoin('chat_rooms', 'chat_rooms.roomId', '=', 'rates.latestRoomId')
            ->select(
                'rates.*',
                'rates.tag_description',
                'customers.custName',
                'tag_menus.tagName',
                'rates.tag_description',
                'tag_menus.group_id as tag_group_id',
                'tag_groups.group_name as tag_group_name',
                DB::raw('chat_rooms."roomName" as "latestRoomName"'),
            );

        if ($platformId) {
            $mainQuery->leftJoin('platform_access_tokens as pat_pf', 'pat_pf.id', '=', 'customers.platformRef')
                ->where('pat_pf.id', $platformId);
        }

        $mainQuery->where(function ($q) use ($wantSuccess, $wantPending, $wantProgress, $closedExists, $acceptedExistsStrict, $start, $end) {
            $first = true;

            if ($wantSuccess) {
                $q->where(function ($w) use ($closedExists) {
                    $w->where('rates.status', 'success')
                        ->whereExists($closedExists);
                });
                $first = false;
            }

            if ($wantPending) {
                $method = $first ? 'where' : 'orWhere';
                $q->{$method}(function ($w) use ($start, $end) {
                    $w->where('rates.status', 'pending')
                        ->whereBetween('rates.created_at', [$start, $end]);
                });
                $first = false;
            }

            if ($wantProgress) {
                $method = $first ? 'where' : 'orWhere';
                $q->{$method}(function ($w) use ($acceptedExistsStrict) {
                    $w->where('rates.status', 'progress')
                        ->whereExists($acceptedExistsStrict);
                });
            }
        });

        $mainCases = $mainQuery->orderBy('rates.id', 'desc')->get();
        $rateIds   = $mainCases->pluck('id')->toArray();

        $acceptedExpr    = 'COALESCE(ac."receiveAt", ac."startTime")';
        $acceptSecsExpr  = "GREATEST(EXTRACT(EPOCH FROM ($acceptedExpr - r.\"created_at\")), 0)";
        $closeSecsExpr   = "GREATEST(EXTRACT(EPOCH FROM (ac.\"endTime\" - $acceptedExpr)), 0)";

        $subCases = DB::connection('pgsql_real')->table('active_conversations as ac')
            ->join('rates as r', 'r.id', '=', 'ac.rateRef')
            ->leftJoin('users', 'users.empCode', '=', 'ac.empCode')
            ->leftJoin('users as from_emp', 'from_emp.empCode', '=', 'ac.from_empCode')
            ->leftJoin('chat_rooms', 'chat_rooms.roomId', '=', 'ac.roomId')
            ->leftJoin('chat_rooms as from_chat_room', 'from_chat_room.roomId', '=', 'ac.from_roomId')
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->when($dept, fn($q) => $q->leftJoin('users as u_f', 'u_f.empCode', '=', 'ac.empCode')
                ->where('u_f.description', $dept))
            ->when($empCode, fn($q) => $q->where('ac.empCode', $empCode))
            ->when(
                $platformId,
                fn($q) =>
                $q->join('customers as c_pf', 'c_pf.custId', '=', 'r.custId')
                    ->where('c_pf.platformRef', $platformId)
            )
            ->whereIn('ac.rateRef', $rateIds)
            ->where(function ($q) use ($start, $end) {
                $q->where(function ($w) use ($start, $end) {
                    $w->where('r.status', 'success')
                        ->whereNotNull('ac.endTime')
                        ->whereBetween('ac.endTime', [$start, $end]);
                })
                    ->orWhere(function ($w) use ($start, $end) {
                        $w->where('r.status', 'pending')
                            ->whereBetween(DB::raw('COALESCE(ac."startTime", ac."receiveAt")'), [$start, $end]);
                    })
                    ->orWhere(function ($w) use ($start, $end) {
                        $w->where('r.status', 'progress')
                            ->whereBetween(DB::raw('ac."receiveAt"'), [$start, $end]);
                    });
            })
            ->select(
                'ac.*',
                'users.name as empName',
                'from_emp.name as from_empName',
                DB::raw('chat_rooms."roomName" as "roomName"'),
                DB::raw('from_chat_room."roomName" as "from_roomName"'),
                DB::raw("$acceptedExpr as accepted_at"),
                DB::raw(
                    "FLOOR(($acceptSecsExpr)/86400)::int || ' วัน ' || 
                     FLOOR(MOD(($acceptSecsExpr), 86400)/3600)::int || ' ชั่วโมง ' || 
                     FLOOR(MOD(($acceptSecsExpr), 3600)/60)::int || ' นาที ' || 
                     FLOOR(MOD(($acceptSecsExpr), 60))::int || ' วินาที' as accept_hhmmss"
                ),
                DB::raw("FLOOR(($closeSecsExpr) / 60)::int as close_minutes")
            )
            ->get()
            ->groupBy('rateRef');

        foreach ($mainCases as $k => $rate) {
            $current = $subCases->get($rate->id, collect());
            $totalH = 0;
            $totalM = 0;
            $totalS = 0;

            if ($current->isNotEmpty()) {
                $latestSubId = $current->max('id');

                foreach ($current as $idx => $sub) {
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

                    $current[$idx]->tagName = ($sub->id == $latestSubId) ? ($rate->tagName ?? 'ไม่ระบุแท็ก') : 'ส่งต่อ';
                    $current[$idx]->close_minutes = isset($sub->close_minutes) ? (int)$sub->close_minutes : 0;
                    $current[$idx]->close_bucket  = $this->bucketCloseMinutes($current[$idx]->close_minutes);

                    if (empty($sub->totalTime)) {
                        $current[$idx]->totalTime = $this->humanizeSeconds(($h * 3600) + ($m * 60) + $s);
                    }
                }
            }

            $totalM += intdiv($totalS, 60);
            $totalS = $totalS % 60;
            $totalH += intdiv($totalM, 60);
            $totalM = $totalM % 60;

            $rate->totalTime = "{$totalH} ชั่วโมง {$totalM} นาที {$totalS} วินาที";
            $rate->sub_case  = $current;
        }

        $headers = [
            'ID เคสหลัก',
            'ชื่อลูกค้า',
            'สถานะ',
            'หมายเลขแท็ก',
            'แท็คการจบสนทนา',
            'รหัสกลุ่มแท็ค',
            'ชื่อกลุ่มแท็ค',
            'คำอธิบายแท็ค',
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

        $colWidths = [
            'A' => 12,
            'B' => 24,
            'C' => 12,
            'D' => 12,
            'E' => 24,
            'F' => 12,
            'G' => 24,
            'H' => 30,
            'I' => 18,
            'J' => 20,
            'K' => 14,
            'L' => 12,
            'M' => 20,
            'N' => 22,
            'O' => 22,
            'P' => 16,
            'Q' => 22,
            'R' => 20,
            'S' => 20,
            'T' => 16,
            'U' => 18,
            'V' => 20,
            'W' => 20,
            'X' => 24
        ];
        foreach ($colWidths as $col => $w) {
            $sheet->getColumnDimension($col)->setAutoSize(false);
            $sheet->getColumnDimension($col)->setWidth($w);
        }

        $blockColors = ['FFFCE5CD', 'FFEAD1DC'];
        $blockColorIdx = 0;
        $paintRange = function ($range, $argb) use ($sheet) {
            $sheet->getStyle($range)->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setARGB($argb);
        };

        $r = 2;
        foreach ($mainCases as $rate) {
            $subs = $rate->sub_case;
            $blockStart = $r;

            if ($subs && $subs->isNotEmpty()) {
                foreach ($subs as $sc) {
                    $sheet->fromArray([[
                        $rate->id,
                        $rate->custName ?? $rate->custId,
                        $rate->status,
                        $rate->tag ?? '',
                        $rate->tagName ?? 'ไม่ระบุแท็ก',
                        $rate->tag_group_id ?? '',
                        $rate->tag_group_name ?? '',
                        $rate->tag_description ?? '',
                        $rate->totalTime,
                        $rate->created_at ? Carbon::parse($rate->created_at)->format('Y-m-d H:i:s') : null,

                        $subs->count(),
                        $sc->id,
                        $sc->tagName,
                        $sc->empName,
                        $sc->roomName,
                        $sc->from_empName,
                        $sc->from_roomName,
                        $sc->created_at ? Carbon::parse($sc->created_at)->format('Y-m-d H:i:s') : null,
                        $sc->accepted_at ? Carbon::parse($sc->accepted_at)->format('Y-m-d H:i:s') : null,
                        $sc->accept_hhmmss,
                        $sc->close_minutes,
                        $sc->close_bucket,
                        $sc->endTime ? Carbon::parse($sc->endTime)->format('Y-m-d H:i:s') : null,
                        $sc->totalTime ?? '',
                    ]], null, "A{$r}");
                    $r++;
                }
                $blockEnd = $r - 1;
                if ($blockEnd >= $blockStart) {
                    $paintRange("A{$blockStart}:X{$blockEnd}", $blockColors[$blockColorIdx]);
                    $blockColorIdx = 1 - $blockColorIdx;
                }
            } else {
                $sheet->fromArray([[
                    $rate->id,
                    $rate->custName ?? $rate->custId,
                    $rate->status,
                    $rate->tag ?? '',
                    $rate->tagName ?? 'ไม่ระบุแท็ก',
                    $rate->tag_group_id ?? '',
                    $rate->tag_group_name ?? '',
                    $rate->tag_description ?? '',
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
                $paintRange("A{$blockStart}:X{$r}", $blockColors[$blockColorIdx]);
                $blockColorIdx = 1 - $blockColorIdx;
                $r++;
            }
        }

        foreach (range('A', 'X') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'DetailedCases_' . $start->format('Ymd') . '-' . $end->format('Ymd') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        $writer->setPreCalculateFormulas(false);

        return response()->streamDownload(function () use ($writer) {
            if (function_exists('ob_get_level')) {
                while (ob_get_level() > 0) {
                    @ob_end_clean();
                }
            }
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
        ]);
    }

    public function exportDetailedCasesRangeInTimeExcel(Request $request): StreamedResponse
    {
        @set_time_limit(300);
        @ini_set('memory_limit', '1024M');

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

        $closedExists = function ($q) use ($start, $end, $dept, $empCode) {
            $q->select(DB::raw(1))
                ->from('active_conversations as ac')
                ->whereColumn('ac.rateRef', 'rates.id')
                ->whereNotNull('ac.endTime')
                ->whereBetween('ac.endTime', [$start, $end])
                ->whereNotIn('ac.empCode', ['BOT', 'adminIT']);

            if ($dept) {
                $q->join('users as u_f', 'u_f.empCode', '=', 'ac.empCode')
                    ->where('u_f.description', $dept);
            }
            if ($empCode) {
                $q->where('ac.empCode', $empCode);
            }
        };

        $mainQuery = DB::connection('pgsql_real')->table('rates')
            ->where('rates.status', 'success')
            ->leftJoin('customers', 'customers.custId', '=', 'rates.custId')
            ->leftJoin('tag_menus', 'rates.tag', '=', 'tag_menus.id') 
            ->leftJoin('tag_groups', 'tag_groups.group_id', '=', 'tag_menus.group_id') 
            ->leftJoin('chat_rooms', 'chat_rooms.roomId', '=', 'rates.latestRoomId')
            ->whereExists($closedExists)
            ->select(
                'rates.*',
                'customers.custName',
                'tag_menus.tagName',
                'tag_menus.group_id as tag_group_id',
                'tag_groups.group_name as tag_group_name',
                'rates.tag_description',
                DB::raw('chat_rooms."roomName" as "latestRoomName"')
            )
            ->orderBy('rates.id', 'desc');
        if ($platformId) {
            $mainQuery->leftJoin('platform_access_tokens as pat_pf', 'pat_pf.id', '=', 'customers.platformRef')
                ->where('pat_pf.id', $platformId);
        }

        $mainCases = $mainQuery->get();
        $rateIds   = $mainCases->pluck('id')->toArray();

        $acceptedExpr   = 'COALESCE(ac."receiveAt", ac."startTime")';
        $acceptSecsExpr = "GREATEST(EXTRACT(EPOCH FROM ($acceptedExpr - r.\"created_at\")), 0)";                  
        $closeSecsExpr  = "GREATEST(EXTRACT(EPOCH FROM (ac.\"endTime\" - $acceptedExpr)), 0)";                   

        $subCases = DB::connection('pgsql_real')->table('active_conversations as ac')
            ->join('rates as r', 'r.id', '=', 'ac.rateRef')
            ->leftJoin('users', 'users.empCode', '=', 'ac.empCode')
            ->leftJoin('users as from_emp', 'from_emp.empCode', '=', 'ac.from_empCode')
            ->leftJoin('chat_rooms', 'chat_rooms.roomId', '=', 'ac.roomId')
            ->leftJoin('chat_rooms as from_chat_room', 'from_chat_room.roomId', '=', 'ac.from_roomId')
            ->when($dept, fn($q) => $q->leftJoin('users as u_f', 'u_f.empCode', '=', 'ac.empCode')
                ->where('u_f.description', $dept))
            ->when($empCode, fn($q) => $q->where('ac.empCode', $empCode))
            ->whereIn('ac.rateRef', $rateIds)
            ->whereNotNull('ac.endTime')
            ->whereBetween('ac.endTime', [$start, $end])
            ->whereNotIn('ac.empCode', ['BOT', 'adminIT'])
            ->select(
                'ac.*',
                'users.name as empName',
                'from_emp.name as from_empName',
                DB::raw('chat_rooms."roomName" as "roomName"'),
                DB::raw('from_chat_room."roomName" as "from_roomName"'),
                DB::raw("$acceptedExpr as accepted_at"),
                DB::raw(
                    "FLOOR(($acceptSecsExpr)/86400)::int || ' วัน ' ||
                 FLOOR(MOD(($acceptSecsExpr), 86400)/3600)::int || ' ชั่วโมง ' ||
                 FLOOR(MOD(($acceptSecsExpr), 3600)/60)::int || ' นาที ' ||
                 FLOOR(MOD(($acceptSecsExpr), 60))::int || ' วินาที' as accept_hhmmss"
                ),
                DB::raw("FLOOR(($closeSecsExpr) / 60)::int as close_minutes")
            )
            ->get()
            ->groupBy('rateRef');

        foreach ($mainCases as $k => $rate) {
            $current = $subCases->get($rate->id, collect());
            $totalH = 0;
            $totalM = 0;
            $totalS = 0;

            if ($current->isNotEmpty()) {
                $latestSubId = $current->max('id');

                foreach ($current as $idx => $sub) {
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

                    $current[$idx]->tagName        = ($sub->id == $latestSubId) ? ($rate->tagName ?? 'ไม่ระบุแท็ก') : 'ส่งต่อ';
                    $current[$idx]->close_minutes  = isset($sub->close_minutes) ? (int)$sub->close_minutes : 0;
                    $current[$idx]->close_bucket   = $this->bucketCloseMinutes($current[$idx]->close_minutes);

                    if (empty($sub->totalTime)) {
                        $current[$idx]->totalTime = $this->humanizeSeconds(($h * 3600) + ($m * 60) + $s);
                    }
                }
            }

            $totalM += intdiv($totalS, 60);
            $totalS %= 60;
            $totalH += intdiv($totalM, 60);
            $totalM %= 60;

            $rate->totalTime = "{$totalH} ชั่วโมง {$totalM} นาที {$totalS} วินาที";
            $rate->sub_case  = $current;
        }

        $headers = [
            'ID เคสหลัก',
            'ชื่อลูกค้า',
            'สถานะ',
            'หมายเลขแท็ก',
            'แท็คการจบสนทนา',
            'รหัสกลุ่มแท็ค',
            'ชื่อกลุ่มแท็ค',
            'คำอธิบายแท็ค',
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
                        $rate->id,
                        $rate->custName ?? $rate->custId,
                        $rate->status,
                        $rate->tag ?? '',
                        $rate->tagName ?? 'ไม่ระบุแท็ก',
                        $rate->tag_group_id ?? '',
                        $rate->tag_group_name ?? '',
                        $rate->tag_description ?? '',
                        $rate->totalTime,
                        $rate->created_at ? Carbon::parse($rate->created_at)->format('Y-m-d H:i:s') : null,

                        $subs->count(),
                        $sc->id,
                        $sc->tagName,
                        $sc->empName,
                        $sc->roomName,
                        $sc->from_empName,
                        $sc->from_roomName,
                        $sc->created_at ? Carbon::parse($sc->created_at)->format('Y-m-d H:i:s') : null,
                        $sc->accepted_at ? Carbon::parse($sc->accepted_at)->format('Y-m-d H:i:s') : null,
                        $sc->accept_hhmmss,
                        $sc->close_minutes,
                        $sc->close_bucket,
                        $sc->endTime ? Carbon::parse($sc->endTime)->format('Y-m-d H:i:s') : null,
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
                    $rate->tag_group_id ?? '',
                    $rate->tag_group_name ?? '',
                    $rate->tag_description ?? '',
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

        foreach (range('A', 'X') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'DetailedCases_' . $start->format('Ymd') . '-' . $end->format('Ymd') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        $writer->setPreCalculateFormulas(false);

        return response()->streamDownload(function () use ($writer) {
            if (function_exists('ob_get_level')) {
                while (ob_get_level() > 0) {
                    @ob_end_clean();
                }
            }
            $writer->save('php://output');
        }, $filename, [
            'Content-Type'  => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma'        => 'no-cache',
        ]);
    }
}
