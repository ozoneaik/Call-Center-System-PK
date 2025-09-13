<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('platform_access_tokens', function (Blueprint $table) {
            if (!Schema::hasColumn('platform_access_tokens', 'tiktok_shop_id')) {
                $table->string('tiktok_shop_id')
                    ->nullable()
                    ->after('tiktok_open_id')
                    ->comment('Shop ID for TikTok');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('platform_access_tokens', function (Blueprint $table) {
            if (Schema::hasColumn('platform_access_tokens', 'tiktok_shop_id')) {
                $table->dropColumn('tiktok_shop_id');
            }
        });
    }
};
