<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * แพลตฟอร์มที่ผู้ใช้ทั่วไปมองเห็น/จัดการได้ในหน้า "จัดการ token" (array ของ key ใน User::TOKEN_PLATFORMS)
 * null = ทุกแพลตฟอร์ม, ผู้ใช้สิทธิ์ admin เห็นทุกแพลตฟอร์มอยู่แล้ว
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('token_platforms')->nullable()->after('admin_menus')->comment('แพลตฟอร์มที่เห็นในหน้าจัดการ token (null = ทั้งหมด)');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('token_platforms');
        });
    }
};
