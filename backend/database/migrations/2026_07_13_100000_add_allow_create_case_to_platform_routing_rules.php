<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('platform_routing_rules', function (Blueprint $table) {
            $table->boolean('allow_create_case')
                ->default(true)
                ->comment('อนุญาตให้สร้างเคสใหม่ในห้องนี้หรือไม่')
                ->after('is_allowed');
        });
    }

    public function down(): void
    {
        Schema::table('platform_routing_rules', function (Blueprint $table) {
            $table->dropColumn('allow_create_case');
        });
    }
};
