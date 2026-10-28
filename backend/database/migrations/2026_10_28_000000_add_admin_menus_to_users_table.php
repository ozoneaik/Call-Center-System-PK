<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * เมนูผู้ดูแลระบบที่อนุญาตให้ผู้ใช้สิทธิ์ "ผู้ใช้ทั่วไป" ใช้งานได้เป็นรายเมนู (array ของ key ใน User::ASSIGNABLE_MENUS)
 * ผู้ใช้สิทธิ์ admin ใช้ได้ทุกเมนูอยู่แล้ว ไม่ต้องอ่านคอลัมน์นี้
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('admin_menus')->nullable()->after('role')->comment('เมนูผู้ดูแลระบบที่อนุญาตสำหรับผู้ใช้ทั่วไป');
        });

        // เดิม 3 รหัสนี้ถูก hardcode ใน Sidebar.jsx ให้เห็นเมนู "จัดการ help Chat" — ย้ายมาเป็นสิทธิ์รายเมนูแทน
        DB::table('users')
            ->whereIn('empCode', ['68501', '68426', '68292'])
            ->where('role', '!=', 'admin')
            ->update(['admin_menus' => json_encode(['help_chat'])]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('admin_menus');
        });
    }
};
