<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * เก็บประวัติ "การ์ดวิเคราะห์ AI" (AI ตอบสดจากข้อความล่าสุด ผ่าน chat-oc-any) ต่อห้องแชท
     * เดิมเก็บแค่ใน React state ฝั่ง frontend เท่านั้น พอรีเฟรชหน้าจอ state หายหมด
     * เหลือแค่รอบที่วิเคราะห์ข้อความล่าสุดตอนโหลดหน้าใหม่ จึงย้ายมาบันทึกจริงที่นี่
     * อยู่ connection หลัก (เดียวกับ active_conversations/chat_histories) เพราะเป็นข้อมูลระหว่างสนทนา
     * ไม่ใช่คลังความรู้ที่ผ่านการอนุมัติ (ต่างจาก ai_kb_entries ที่อยู่ pgsql_kb)
     */
    public function up(): void
    {
        Schema::create('ai_live_suggestions', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('active_conversation_id')
                ->comment('ห้องแชทที่วิเคราะห์');
            $table->string('cust_id')->nullable()->comment('รหัสลูกค้าที่เกี่ยวข้อง');

            // message_ref = key ของข้อความลูกค้าที่ใช้วิเคราะห์ (id หรือ created_at ของ chat_histories)
            // ใช้กันวิเคราะห์ซ้ำข้อความเดิมตอนโหลดหน้าใหม่
            $table->string('message_ref')->nullable()
                ->comment('key ของข้อความลูกค้าที่ใช้วิเคราะห์รอบนี้ กันวิเคราะห์ซ้ำตอนรีเฟรช');

            $table->text('question')->nullable()->comment('สรุปคำถามของลูกค้าโดย AI');
            $table->text('content')->comment('ร่างคำตอบที่ AI แนะนำ');
            $table->string('source', 20)->nullable()->comment('แหล่งที่มาของคำตอบ เช่น kb, web, ai');
            $table->text('reference')->nullable()->comment('ข้อมูลอ้างอิงเพิ่มเติม เช่น สินค้าที่จับคู่ได้');

            $table->timestamps();

            $table->index('active_conversation_id');
            $table->index('cust_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_live_suggestions');
    }
};
