<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    protected $connection = 'pgsql_kb';

    public function up(): void
    {
        DB::connection('pgsql_kb')->statement(
            'ALTER TABLE knowledge_base_entries ADD COLUMN IF NOT EXISTS active_conversation_id BIGINT NULL'
        );
        DB::connection('pgsql_kb')->statement(
            'CREATE UNIQUE INDEX IF NOT EXISTS kb_entries_active_conversation_id_unique ON knowledge_base_entries (active_conversation_id)'
        );
    }

    public function down(): void
    {
        DB::connection('pgsql_kb')->statement(
            'DROP INDEX IF EXISTS kb_entries_active_conversation_id_unique'
        );
        DB::connection('pgsql_kb')->statement(
            'ALTER TABLE knowledge_base_entries DROP COLUMN IF EXISTS active_conversation_id'
        );
    }
};
