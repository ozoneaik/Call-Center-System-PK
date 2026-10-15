<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * ค่าตั้งระบบ AI ตอบอัตโนมัติจาก KB (มีแถวเดียว)
 * mode: off = ปิด, shadow = ทดลอง (บันทึกว่าจะส่งอะไร แต่ไม่ส่งจริง), live = ส่งให้ลูกค้าจริง
 */
class KbAutoReplySetting extends Model
{
    public const MODES = ['off', 'shadow', 'live'];
    // สถานะเคส (rates.status) ที่เลือกให้บอทตอบได้
    public const CASE_STATUSES = ['pending', 'progress'];
    private const CACHE_KEY = 'kb_auto_reply_settings';

    protected $connection = 'pgsql_kb';
    protected $table = 'kb_auto_reply_settings';

    protected $fillable = ['mode', 'min_score', 'min_margin', 'room_ids', 'case_statuses', 'updated_by', 'updated_by_name'];

    protected $casts = [
        'min_score'  => 'float',
        'min_margin' => 'float',
        'room_ids'   => 'array',
        'case_statuses' => 'array',
    ];

    /** สถานะเคสนี้เปิดให้บอทตอบหรือไม่ (ไม่ได้ตั้งค่า = เฉพาะ pending เหมือนเดิม) */
    public function allowsCaseStatus(?string $status): bool
    {
        $allowed = array_filter((array) ($this->case_statuses ?? ['pending']));
        return $status !== null && in_array($status, $allowed ?: ['pending'], true);
    }

    /** ห้องนี้เปิดใช้ระบบตอบอัตโนมัติหรือไม่ (ไม่ได้เลือกห้องไว้ = ทุกห้อง) */
    public function allowsRoom(?string $roomId): bool
    {
        $rooms = array_filter((array) ($this->room_ids ?? []));
        return empty($rooms) || ($roomId !== null && in_array($roomId, $rooms, true));
    }

    /** ค่าปัจจุบัน (cache 30 วิ เพราะถูกเรียกทุกข้อความที่ลูกค้าทักเข้ามา) */
    public static function current(): self
    {
        return Cache::remember(self::CACHE_KEY, 30, function () {
            return self::query()->orderBy('id')->first()
                ?? self::create(['mode' => 'off', 'min_score' => 0.6, 'min_margin' => 0.1]);
        });
    }

    public static function forgetCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
