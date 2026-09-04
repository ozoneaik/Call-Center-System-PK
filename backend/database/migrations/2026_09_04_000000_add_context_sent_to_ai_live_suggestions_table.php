<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * เก็บ transcript บทสนทนาที่ backend ประกอบขึ้นแล้วส่งไปให้ chat-oc-any จริง ๆ (จาก buildConversationContext())
     * ไว้ตรวจสอบย้อนหลังได้ว่า AI เห็นบริบทอะไรบ้างตอนตอบรอบนี้ — เดิมต้องเข้า tinker เรียก method
     * ตรง ๆ เพื่อดูค่านี้ ไม่สะดวกเวลา debug ว่าทำไม AI ตอบไม่ตรงบริบท
     */
    public function up(): void
    {
        Schema::table('ai_live_suggestions', function (Blueprint $table) {
            $table->text('context_sent')->nullable()->after('message_ref')
                ->comment('transcript บทสนทนาที่ประกอบแล้วส่งเป็น message ให้ chat-oc-any จริงในรอบนี้');
        });
    }

    public function down(): void
    {
        Schema::table('ai_live_suggestions', function (Blueprint $table) {
            $table->dropColumn('context_sent');
        });
    }
};
