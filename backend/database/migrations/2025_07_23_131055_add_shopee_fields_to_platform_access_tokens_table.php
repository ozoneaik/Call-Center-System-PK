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
        // ใช้ Schema::table() เพื่อแก้ไขตารางที่มีอยู่แล้ว
        Schema::table('platform_access_tokens', function (Blueprint $table) {
            // เพิ่มคอลัมน์ทั้งหมดที่จำเป็นสำหรับ Shopee
            // โดยกำหนดให้สามารถเป็นค่าว่างได้ (nullable) เพื่อไม่ให้กระทบกับข้อมูลเดิม
            $table->string('shopee_partner_id')->nullable()->after('platform')->comment('Partner ID for Shopee');
            $table->string('shopee_partner_key')->nullable()->after('shopee_partner_id')->comment('Partner Key for Shopee');
            $table->string('shopee_shop_id')->nullable()->after('shopee_partner_key')->comment('Shop ID for Shopee');

            // เปลี่ยนชื่อคอลัมน์ accessToken ให้สื่อความหมายมากขึ้นสำหรับ Shopee
            // และเพิ่มคอลัมน์สำหรับ refresh token
            $table->text('shopee_refresh_token')->nullable()->after('accessToken')->comment('Refresh Token for Shopee');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // ใช้ Schema::table() เพื่อให้สามารถย้อนกลับการเปลี่ยนแปลงได้
        Schema::table('platform_access_tokens', function (Blueprint $table) {
            $table->dropColumn([
                'shopee_partner_id',
                'shopee_partner_key',
                'shopee_shop_id',
                'shopee_refresh_token',
            ]);
        });
    }
};
