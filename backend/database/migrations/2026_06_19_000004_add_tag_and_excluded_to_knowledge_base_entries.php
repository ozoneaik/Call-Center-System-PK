<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::connection('pgsql_kb')->statement('
            ALTER TABLE knowledge_base_entries
                ADD COLUMN IF NOT EXISTS tag_name   VARCHAR NULL,
                ADD COLUMN IF NOT EXISTS is_excluded BOOLEAN NOT NULL DEFAULT FALSE
        ');
    }

    public function down(): void
    {
        DB::connection('pgsql_kb')->statement('
            ALTER TABLE knowledge_base_entries
                DROP COLUMN IF EXISTS tag_name,
                DROP COLUMN IF EXISTS is_excluded
        ');
    }
};
