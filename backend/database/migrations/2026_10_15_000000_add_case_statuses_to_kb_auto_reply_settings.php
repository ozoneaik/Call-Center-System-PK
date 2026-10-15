<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * case_statuses: สถานะเคส (rates.status) ที่ให้ระบบ AI ตอบอัตโนมัติทำงาน — ["pending"], ["progress"] หรือทั้งสอง
 * ค่าเริ่มต้น ["pending"] = เหมือนพฤติกรรมเดิม (ตอบเฉพาะตอนยังไม่มีพนักงานรับเรื่อง)
 */
return new class extends Migration
{
    protected $connection = 'pgsql_kb';

    public function up(): void
    {
        DB::connection('pgsql_kb')->statement(
            "ALTER TABLE kb_auto_reply_settings ADD COLUMN IF NOT EXISTS case_statuses JSONB NOT NULL DEFAULT '[\"pending\"]'::jsonb"
        );
    }

    public function down(): void
    {
        DB::connection('pgsql_kb')->statement(
            'ALTER TABLE kb_auto_reply_settings DROP COLUMN IF EXISTS case_statuses'
        );
    }
};
