<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * เพิ่มการตั้งค่า "ข้อความส่งอัตโนมัติ" ให้ ai_kb_entries
 * - auto_reply: แอดมินอนุญาตให้ AI ส่งคำตอบของรายการนี้ให้ลูกค้าได้เองโดยไม่ต้องรอพนักงาน
 *   (ใช้ได้เฉพาะรายการที่ admin_status = approved และ is_active = true)
 * - auto_reply_by/auto_reply_by_name/auto_reply_at: ผู้เปลี่ยนค่านี้ล่าสุด
 */
return new class extends Migration
{
    protected $connection = 'pgsql_kb';

    public function up(): void
    {
        $db = DB::connection('pgsql_kb');

        $db->statement('
            ALTER TABLE ai_kb_entries
                ADD COLUMN IF NOT EXISTS auto_reply BOOLEAN NOT NULL DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS auto_reply_by BIGINT NULL,
                ADD COLUMN IF NOT EXISTS auto_reply_by_name VARCHAR(255) NULL,
                ADD COLUMN IF NOT EXISTS auto_reply_at TIMESTAMP NULL
        ');

        $db->statement(
            'CREATE INDEX IF NOT EXISTS ai_kb_entries_auto_reply_idx '
            . 'ON ai_kb_entries (auto_reply) WHERE is_active = TRUE AND admin_status = \'approved\''
        );
    }

    public function down(): void
    {
        $db = DB::connection('pgsql_kb');
        $db->statement('DROP INDEX IF EXISTS ai_kb_entries_auto_reply_idx');
        $db->statement('
            ALTER TABLE ai_kb_entries
                DROP COLUMN IF EXISTS auto_reply,
                DROP COLUMN IF EXISTS auto_reply_by,
                DROP COLUMN IF EXISTS auto_reply_by_name,
                DROP COLUMN IF EXISTS auto_reply_at
        ');
    }
};
