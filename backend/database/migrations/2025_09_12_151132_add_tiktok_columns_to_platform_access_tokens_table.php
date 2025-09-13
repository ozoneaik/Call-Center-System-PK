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
            //
            $table->string('tiktok_open_id')->nullable()->after('laz_seller_id');
            $table->string('tiktok_seller_name')->nullable()->after('tiktok_open_id');
            $table->string('tiktok_region')->nullable()->after('tiktok_seller_name');
            $table->string('tiktok_app_key')->nullable()->after('tiktok_region');
            $table->string('tiktok_app_secret')->nullable()->after('tiktok_app_key');
            $table->text('tiktok_refresh_token')->nullable()->after('tiktok_app_secret');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('platform_access_tokens', function (Blueprint $table) {
            //
        });
    }
};
