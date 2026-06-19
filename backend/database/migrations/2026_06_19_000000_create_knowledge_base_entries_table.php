<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'pgsql_kb';

    public function up(): void
    {
        Schema::connection('pgsql_kb')->create('knowledge_base_entries', function (Blueprint $table) {
            $table->id();

            // ข้อมูลแชทของลูกค้าในรูปแบบ JSON
            $table->jsonb('chat_data')->comment('ข้อมูลการสนทนาของลูกค้าในรูปแบบ JSON');

            // ผลลัพธ์จาก AI
            $table->text('ai_topic')->comment('สิ่งที่ AI วิเคราะห์ว่าลูกค้าติดต่อเรื่องอะไร / เกี่ยวกับอะไร');
            $table->text('ai_answer')->comment('คำตอบที่ AI สรุปและตอบกลับ');

            // การยืนยันจากแอดมิน
            $table->string('admin_status', 20)->default('pending')
                ->comment('สถานะการยืนยัน: pending = รอตรวจ, approved = อนุมัติ, rejected = ปฏิเสธ');
            $table->text('admin_answer')->nullable()
                ->comment('คำตอบที่แอดมินปรับแก้ (ใช้เมื่อ admin_status = rejected)');
            $table->text('admin_note')->nullable()
                ->comment('หมายเหตุจากแอดมิน');

            // ข้อมูลผู้อนุมัติ
            $table->unsignedBigInteger('approved_by')->nullable()
                ->comment('ID ของแอดมินที่ยืนยัน (อ้างอิง users ใน main DB)');
            $table->string('approved_by_name')->nullable()
                ->comment('ชื่อแอดมินที่ยืนยัน (เก็บไว้เผื่อ user ถูกลบ)');
            $table->timestamp('approved_at')->nullable()
                ->comment('เวลาที่แอดมินยืนยัน');

            // metadata
            $table->string('platform')->nullable()
                ->comment('แพลตฟอร์มที่มาของแชท เช่น line, facebook, tiktok');
            $table->string('room_id')->nullable()
                ->comment('รหัสห้องแชทที่เกี่ยวข้อง');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('pgsql_kb')->dropIfExists('knowledge_base_entries');
    }
};
