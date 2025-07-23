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
        Schema::create('platform_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('accessTokenId')->unique()->comment('รหัสอ้างอิง');
            $table->string('accessToken', 512)->unique()->comment('channel access token');
            $table->string('description')->comment('คำอธิบาย token');
            $table->string('platform')->comment('จากแพลตฟอร์มไหน');

            // --- เพิ่มคอลัมน์สำหรับ Facebook ---
            $table->string('fb_page_id')->nullable()->comment('id pags facebook');
            $table->string('fb_verify_token')->nullable()->comment('verify token facebook');

            // --- เพิ่มคอลัมน์สำหรับ Lazada ---
            $table->string('laz_app_key')->nullable()->comment('App Key for Lazada');
            $table->string('laz_app_secret')->nullable()->comment('App Secret for Lazada');

            $table->string('room_default_id')->default('ROOM99')->comment('ห้องแชทเริ่มต้น');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_access_tokens');
    }
};
