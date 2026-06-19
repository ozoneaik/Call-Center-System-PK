<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    protected $connection = 'pgsql_kb';

    public function up(): void
    {
        DB::connection('pgsql_kb')->statement(
            'ALTER TABLE knowledge_base_entries ALTER COLUMN ai_topic DROP NOT NULL'
        );
        DB::connection('pgsql_kb')->statement(
            'ALTER TABLE knowledge_base_entries ALTER COLUMN ai_answer DROP NOT NULL'
        );
    }

    public function down(): void
    {
        DB::connection('pgsql_kb')->statement(
            "ALTER TABLE knowledge_base_entries ALTER COLUMN ai_topic SET NOT NULL"
        );
        DB::connection('pgsql_kb')->statement(
            "ALTER TABLE knowledge_base_entries ALTER COLUMN ai_answer SET NOT NULL"
        );
    }
};
