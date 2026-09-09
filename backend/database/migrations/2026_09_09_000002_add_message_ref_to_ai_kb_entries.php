<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * เพิ่ม message_ref ให้ ai_kb_entries เพื่อจดจำว่ารายการนี้มาจาก "ข้อความไหน" ในบทสนทนา
 * (ไม่ใช่แค่ active_conversation_id ที่ชี้ทั้งห้อง) — ใช้ค่าเดียวกับ ai_live_suggestions.message_ref
 * คือ id ของ chat_histories (เป็น string) หรือ created_at เป็น fallback เมื่อไม่มี id
 * ให้หน้าจำลองแชท (EntryReviewPage) ไฮไลต์/เลื่อนไปยังข้อความต้นทางได้
 */
return new class extends Migration
{
    protected $connection = 'pgsql_kb';

    public function up(): void
    {
        DB::connection('pgsql_kb')->statement(
            'ALTER TABLE ai_kb_entries ADD COLUMN IF NOT EXISTS message_ref VARCHAR NULL'
        );
    }

    public function down(): void
    {
        DB::connection('pgsql_kb')->statement(
            'ALTER TABLE ai_kb_entries DROP COLUMN IF EXISTS message_ref'
        );
    }
};
