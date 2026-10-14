<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * ระบบ "AI ตอบอัตโนมัติจาก KB"
 * - kb_auto_reply_settings: ค่าตั้งระบบ (แถวเดียว) — mode: off / shadow (ทดลอง บันทึกอย่างเดียว) / live (ส่งจริง)
 *   min_score = คะแนนความคล้าย (pg_trgm similarity 0-1) ขั้นต่ำ, min_margin = อันดับ 1 ต้องชนะอันดับ 2 อย่างน้อยเท่านี้
 * - kb_auto_reply_logs: บันทึกทุกครั้งที่ระบบตัดสินใจ (ส่ง/จะส่ง/ไม่ส่ง เพราะอะไร) ไว้ปรับเกณฑ์และตรวจย้อนหลัง
 */
return new class extends Migration
{
    protected $connection = 'pgsql_kb';

    public function up(): void
    {
        $db = DB::connection('pgsql_kb');

        $db->statement("
            CREATE TABLE IF NOT EXISTS kb_auto_reply_settings (
                id BIGSERIAL PRIMARY KEY,
                mode VARCHAR(10) NOT NULL DEFAULT 'off',
                min_score NUMERIC(4,3) NOT NULL DEFAULT 0.600,
                min_margin NUMERIC(4,3) NOT NULL DEFAULT 0.100,
                updated_by BIGINT NULL,
                updated_by_name VARCHAR(255) NULL,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL
            )
        ");

        $db->statement("
            CREATE TABLE IF NOT EXISTS kb_auto_reply_logs (
                id BIGSERIAL PRIMARY KEY,
                cust_id VARCHAR(255) NULL,
                active_conversation_id BIGINT NULL,
                chat_history_id BIGINT NULL,
                platform VARCHAR(20) NULL,
                room_id VARCHAR(50) NULL,
                customer_message TEXT NULL,
                ai_query TEXT NULL,
                ai_summary TEXT NULL,
                ai_similarity NUMERIC(6,2) NULL,
                ai_knowledgefrom VARCHAR(50) NULL,
                matched_entry_id BIGINT NULL,
                matched_score NUMERIC(4,3) NULL,
                matched_by VARCHAR(20) NULL,
                second_entry_id BIGINT NULL,
                second_score NUMERIC(4,3) NULL,
                mode VARCHAR(10) NOT NULL,
                decision VARCHAR(30) NOT NULL,
                reason TEXT NULL,
                created_at TIMESTAMP NULL,
                updated_at TIMESTAMP NULL
            )
        ");
        $db->statement('CREATE INDEX IF NOT EXISTS kb_auto_reply_logs_created_idx ON kb_auto_reply_logs (created_at DESC)');
        $db->statement('CREATE INDEX IF NOT EXISTS kb_auto_reply_logs_decision_idx ON kb_auto_reply_logs (decision)');
        $db->statement('CREATE INDEX IF NOT EXISTS kb_auto_reply_logs_ac_idx ON kb_auto_reply_logs (active_conversation_id, matched_entry_id)');
    }

    public function down(): void
    {
        $db = DB::connection('pgsql_kb');
        $db->statement('DROP TABLE IF EXISTS kb_auto_reply_logs');
        $db->statement('DROP TABLE IF EXISTS kb_auto_reply_settings');
    }
};
