<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop unique constraint and make date_time nullable (PostgreSQL syntax)
        DB::statement('ALTER TABLE holidays DROP CONSTRAINT IF EXISTS holidays_date_time_unique');
        DB::statement('ALTER TABLE holidays ALTER COLUMN date_time DROP NOT NULL');

        Schema::table('holidays', function (Blueprint $table) {
            $table->text('message')->nullable()->after('holiday_name');
            $table->date('start_date')->nullable()->after('message');
            $table->date('end_date')->nullable()->after('start_date');
        });
    }

    public function down(): void
    {
        Schema::table('holidays', function (Blueprint $table) {
            $table->dropColumn(['message', 'start_date', 'end_date']);
        });
        DB::statement('ALTER TABLE holidays ALTER COLUMN date_time SET NOT NULL');
        DB::statement('CREATE UNIQUE INDEX holidays_date_time_unique ON holidays (date_time)');
    }
};
