<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * เพิ่ม index ให้หน้า "จัดการ Knowledge Base" (list/filter/search) เร็วขึ้น
 * ใช้คู่กับการเปลี่ยน KnowledgeBaseService@list ให้ query แบบแบ่งหน้า (LIMIT/OFFSET)
 * ที่ SQL แทนการดึงทุกแถวมา filter ฝั่ง PHP
 */
return new class extends Migration
{
    protected $connection = 'pgsql_kb';

    public function up(): void
    {
        $db = DB::connection('pgsql_kb');

        // ใช้กรอง + เรียงลำดับหลักของหน้า list (is_excluded, admin_status, ORDER BY created_at DESC)
        $db->statement(
            'CREATE INDEX IF NOT EXISTS knowledge_base_entries_list_idx '
            . 'ON knowledge_base_entries (is_excluded, admin_status, created_at DESC)'
        );

        // ใช้กรองตาม tag
        $db->statement(
            'CREATE INDEX IF NOT EXISTS knowledge_base_entries_tag_name_idx '
            . 'ON knowledge_base_entries (tag_name)'
        );

        // ใช้กับช่องค้นหา (ILIKE '%...%') — พึ่ง pg_trgm ที่เปิดใช้แล้วจาก migration ก่อนหน้า
        try {
            $db->statement(
                'CREATE INDEX IF NOT EXISTS knowledge_base_entries_ai_answer_trgm_idx '
                . 'ON knowledge_base_entries USING gin (ai_answer gin_trgm_ops)'
            );
            $db->statement(
                'CREATE INDEX IF NOT EXISTS knowledge_base_entries_chat_data_trgm_idx '
                . 'ON knowledge_base_entries USING gin ((chat_data::text) gin_trgm_ops)'
            );
        } catch (\Throwable $e) {
            Log::warning('add_kb_list_performance_indexes: สร้าง GIN trgm index ไม่สำเร็จ — ' . $e->getMessage());
        }
    }

    public function down(): void
    {
        $db = DB::connection('pgsql_kb');
        $db->statement('DROP INDEX IF EXISTS knowledge_base_entries_list_idx');
        $db->statement('DROP INDEX IF EXISTS knowledge_base_entries_tag_name_idx');
        $db->statement('DROP INDEX IF EXISTS knowledge_base_entries_ai_answer_trgm_idx');
        $db->statement('DROP INDEX IF EXISTS knowledge_base_entries_chat_data_trgm_idx');
    }
};
