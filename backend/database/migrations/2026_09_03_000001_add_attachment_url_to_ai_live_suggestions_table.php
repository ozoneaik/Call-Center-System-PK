<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * เก็บ URL รูปหน้าแคตตาล็อก/โบรชัวร์ (brochure_page_url) ที่ chat-oc-any แนบมาให้ตอนลูกค้า
     * ขอดูรายละเอียดสินค้าแบบเป็นรูปหน้าหนังสือ — ใช้โชว์ preview ในการ์ด AI Assistant
     * และกดปุ่ม "ส่งรูปนี้ให้ลูกค้า" ได้จากหน้าแชทโดยตรง
     */
    public function up(): void
    {
        Schema::table('ai_live_suggestions', function (Blueprint $table) {
            $table->text('attachment_url')->nullable()->after('reference')
                ->comment('URL รูปหน้าแคตตาล็อก/โบรชัวร์ที่ AI แนบมา (ถ้ามี)');
        });
    }

    public function down(): void
    {
        Schema::table('ai_live_suggestions', function (Blueprint $table) {
            $table->dropColumn('attachment_url');
        });
    }
};
