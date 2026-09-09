<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * เพิ่ม workflow อนุมัติของแอดมินให้ ai_kb_entries (เดิมมีแค่ is_active เปิด/ปิด)
 * - admin_status: pending (รอตรวจ) / approved (อนุมัติ) / rejected (ปรับแก้แล้ว)
 * - admin_answer/admin_note: คำตอบที่แอดมินแก้ไข (ใช้แทน answer เมื่อ admin_status = rejected)
 * - approved_by/approved_by_name/approved_at: ผู้อนุมัติ/แก้ไขล่าสุด
 *
 * แถวเดิมทั้งหมดจะได้ admin_status = 'pending' จาก DEFAULT (ต้องรอตรวจใหม่ก่อน AI
 * ถึงจะดึงไปแนะนำได้ — ดู KbRetrievalService::searchAiKbEntries)
 */
return new class extends Migration
{
    protected $connection = 'pgsql_kb';

    public function up(): void
    {
        $db = DB::connection('pgsql_kb');

        $db->statement("
            ALTER TABLE ai_kb_entries
                ADD COLUMN IF NOT EXISTS admin_status VARCHAR(20) NOT NULL DEFAULT 'pending',
                ADD COLUMN IF NOT EXISTS admin_answer TEXT NULL,
                ADD COLUMN IF NOT EXISTS admin_note TEXT NULL,
                ADD COLUMN IF NOT EXISTS approved_by BIGINT NULL,
                ADD COLUMN IF NOT EXISTS approved_by_name VARCHAR(255) NULL,
                ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL
        ");

        $db->statement(
            'CREATE INDEX IF NOT EXISTS ai_kb_entries_list_idx '
            . 'ON ai_kb_entries (is_active, admin_status, created_at DESC)'
        );
    }

    public function down(): void
    {
        $db = DB::connection('pgsql_kb');
        $db->statement('DROP INDEX IF EXISTS ai_kb_entries_list_idx');
        $db->statement('
            ALTER TABLE ai_kb_entries
                DROP COLUMN IF EXISTS admin_status,
                DROP COLUMN IF EXISTS admin_answer,
                DROP COLUMN IF EXISTS admin_note,
                DROP COLUMN IF EXISTS approved_by,
                DROP COLUMN IF EXISTS approved_by_name,
                DROP COLUMN IF EXISTS approved_at
        ');
    }
};
