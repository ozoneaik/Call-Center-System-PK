<?php

namespace App\Http\Controllers\Home\UserCase\Traits;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

trait BusinessHourHelpers
{
    protected function applyPlatformFilter($q, $platformId)
    {
        if (!$platformId) return $q;

        return $q
            ->join('customers as c_pf', 'c_pf.custId', '=', 'ac.custId')
            ->join('platform_access_tokens as pat_pf', 'pat_pf.id', '=', 'c_pf.platformRef')
            ->where('pat_pf.id', $platformId);
    }

    protected function applyUserFilters($q, $dept, $empCode)
    {
        if ($dept) {
            $q->join('users as u_f', 'u_f.empCode', '=', 'ac.empCode')
                ->where('u_f.description', $dept);
        }
        if ($empCode) {
            $q->where('ac.empCode', $empCode);
        }
        return $q;
    }

    protected function durationSelectRaw(): string
    {
        return '
            COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") <= 60)  AS within_1_min,
            COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") > 60
                             AND EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") <= 300) AS one_to_five_min,
            COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") > 300
                             AND EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") <= 600) AS five_to_ten_min,
            COUNT(*) FILTER (WHERE EXTRACT(EPOCH FROM ac."endTime" - ac."startTime") > 600) AS over_ten_min,
            COUNT(*) AS total
        ';
    }

    protected function bucketLabels(): array
    {
        return [
            'within_1_min'     => '⏱ ภายใน 1 นาที',
            'one_to_five_min'  => '🕐 1-5 นาที',
            'five_to_ten_min'  => '🕒 5-10 นาที',
            'over_ten_min'     => '⏰ มากกว่า 10 นาที',
        ];
    }

    /** แปลงผลรวม in/out → array ตามที่ frontend ใช้ */
    protected function buildDurationBuckets(?object $in, ?object $out): array
    {
        $labels = $this->bucketLabels();
        $data   = [];
        foreach ($labels as $key => $label) {
            $inVal  = (int)($in->$key  ?? 0);
            $outVal = (int)($out->$key ?? 0);
            $data[] = [
                'label'      => $label,
                'in_time'    => $inVal,
                'out_time'   => $outVal,
                'total_case' => $inVal + $outVal
            ];
        }
        return $data;
    }

    /** เวลาเริ่มทำงาน: ถ้ามี receiveAt ใช้ receiveAt ไม่งั้นใช้ startTime */
    protected function startExpr(): string
    {
        return 'COALESCE(ac."receiveAt", ac."startTime")';
    }

    /** ในเวลาทำการ: 08:00–17:00 และไม่ใช่อาทิตย์ */
    protected function applyInHours($q, string $col)
    {
        return $q->whereRaw("$col::time BETWEEN '08:00:00' AND '17:00:00'")
            ->whereRaw("EXTRACT(DOW FROM $col)::int <> 0");
    }

    /** นอกเวลาทำการ: ก่อน 08:00 หรือ หลัง 17:00 หรือเป็นวันอาทิตย์ทั้งวัน */
    protected function applyOutHours($q, string $col)
    {
        return $q->where(function ($qq) use ($col) {
            $qq->whereRaw("$col::time < '08:00:00'")
                ->orWhereRaw("$col::time > '17:00:00'")
                ->orWhereRaw("EXTRACT(DOW FROM $col)::int = 0");
        });
    }
}
