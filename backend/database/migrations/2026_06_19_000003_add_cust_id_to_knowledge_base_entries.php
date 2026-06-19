<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    protected $connection = 'pgsql_kb';

    public function up(): void
    {
        DB::connection('pgsql_kb')->statement(
            'ALTER TABLE knowledge_base_entries ADD COLUMN IF NOT EXISTS cust_id VARCHAR NULL'
        );
    }

    public function down(): void
    {
        DB::connection('pgsql_kb')->statement(
            'ALTER TABLE knowledge_base_entries DROP COLUMN IF EXISTS cust_id'
        );
    }
};
