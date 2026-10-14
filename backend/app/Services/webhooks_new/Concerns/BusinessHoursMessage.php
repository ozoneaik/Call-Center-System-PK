<?php

namespace App\Services\webhooks_new\Concerns;

use App\Models\Holiday;
use Carbon\Carbon;

trait BusinessHoursMessage
{
    /**
     * ข้อความแจ้งลูกค้าเมื่อเคสถูกส่งต่อไปยังเจ้าหน้าที่
     * เช็ควันหยุดที่ตั้งไว้ในหน้า "จัดการวันหยุด" ก่อน แล้วค่อยเช็คเวลาทำการของบริษัท (จ-ส 08:00-17:00 หยุดอาทิตย์)
     */
    protected function forwardToStaffMessage(?Carbon $now = null): string
    {
        $now = $now ?? Carbon::now();

        $holiday = $this->activeHoliday($now);
        if ($holiday && !empty($holiday->message)) {
            return $holiday->message;
        }

        if (($now->isSaturday() && $now->hour >= 17) || $now->isSunday() || $holiday) {
            return "ระบบกำลังส่งเรื่องไปยังเจ้าหน้าที่ เพื่อให้บริการท่านในเวลาทำการของบริษัท \n"
                . "บริษัทขออนุญาตแจ้งเวลาทําการคือวันจันทร์-เสาร์ เวลา 08:00-17:00น. หยุดทุกวันอาทิตย์และนักขัตฤกษ์ เจ้าหน้าที่จะเร่งดำเนินการตอบกลับโดยเร็วในเวลาทำการ ต้องขออภัยเป็นอย่างสูง ครับ/ค่ะ🧡";
        }

        if ($now->hour >= 17 || $now->hour < 8) {
            return "ขณะนี้เป็นเวลานอกทำการของบริษัท เจ้าหน้าที่จะกลับมาบริการท่านในเวลาทำการของบริษัท \n"
                . "บริษัทขออนุญาตแจ้งเวลาทําการคือวันจันทร์-เสาร์ เวลา 08:00-17:00น. หยุดทุกวันอาทิตย์และนักขัตฤกษ์ เจ้าหน้าที่จะเร่งดำเนินการตอบกลับโดยเร็วในเวลาทำการ ต้องขออภัยเป็นอย่างสูง ครับ/ค่ะ🧡";
        }

        return 'ระบบกำลังส่งต่อให้เจ้าหน้าที่ กรุณารอซักครู่';
    }

    /**
     * เช็คว่าตอนนี้อยู่นอกเวลาทำการของบริษัทหรือไม่ — วันหยุดที่ตั้งไว้ (holidays), วันอาทิตย์, ก่อน 08:00 หรือหลัง 17:00
     */
    protected function isOutOfBusinessHours(?Carbon $now = null): bool
    {
        $now = $now ?? Carbon::now();

        return $this->activeHoliday($now) !== null
            || $now->isSunday()
            || $now->hour < 8
            || $now->hour >= 17;
    }

    /**
     * วันหยุดที่เปิดใช้งาน (is_active) และครอบคลุมวันนี้ ตามที่ตั้งไว้ในหน้า "จัดการวันหยุด"
     */
    protected function activeHoliday(?Carbon $now = null): ?Holiday
    {
        $today = ($now ?? Carbon::now())->toDateString();

        return Holiday::where('is_active', true)
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->first();
    }
}
