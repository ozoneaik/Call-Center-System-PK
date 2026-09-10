<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * เพิ่ม answer_attachments ให้ ai_kb_entries — เก็บรูปภาพ/วิดีโอที่แนบมากับคำตอบตอนกด
 * "บันทึกและใช้ร่างคำตอบและบันทึกเข้า KB" (หรือ "เพิ่มเข้า KB" ทั่วไป) จากหน้าแชท
 * เก็บเป็น JSON array ของ {url, contentType} เผื่อมีหลายไฟล์ต่อคำตอบเดียว
 */
return new class extends Migration
{
    protected $connection = 'pgsql_kb';

    public function up(): void
    {
        DB::connection('pgsql_kb')->statement(
            'ALTER TABLE ai_kb_entries ADD COLUMN IF NOT EXISTS answer_attachments JSONB NULL'
        );
    }

    public function down(): void
    {
        DB::connection('pgsql_kb')->statement(
            'ALTER TABLE ai_kb_entries DROP COLUMN IF EXISTS answer_attachments'
        );
    }
};
