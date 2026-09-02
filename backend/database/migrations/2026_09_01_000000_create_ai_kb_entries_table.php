<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'pgsql_kb';

    /**
     * เก็บความรู้ (คำถาม-คำตอบ) ที่พนักงานกด "เพิ่มเข้า KB" เองจากหน้าแชท (AI Assistant panel)
     * แยกจาก knowledge_base_entries เพราะตารางนั้นออกแบบให้ 1 แถวต่อ 1 active_conversation (unique)
     * สำหรับ pipeline วิเคราะห์อัตโนมัติหลังจบสนทนา ส่วนตารางนี้เพิ่มได้หลายรายการต่อแชทเดียวระหว่างคุยอยู่
     */
    public function up(): void
    {
        Schema::connection('pgsql_kb')->create('ai_kb_entries', function (Blueprint $table) {
            $table->id();

            $table->text('question')->comment('คำถามของลูกค้า');
            $table->text('answer')->comment('คำตอบที่จะบันทึกเข้า KB');
            $table->text('note')->nullable()->comment('หมายเหตุเพิ่มเติมจากพนักงาน');

            $table->string('source', 20)->nullable()
                ->comment('แหล่งที่มาของคำตอบตอนที่เพิ่ม เช่น kb, web, ai');
            $table->string('tag_name')->nullable()->comment('แท็กหมวดหมู่ (ถ้ามี)');

            // อ้างอิงบริบทที่มาของรายการนี้
            $table->string('cust_id')->nullable()->comment('รหัสลูกค้าที่เกี่ยวข้อง');
            $table->unsignedBigInteger('active_conversation_id')->nullable()
                ->comment('ห้องแชทที่เพิ่มรายการนี้มา (ไม่ unique เพราะเพิ่มได้หลายรายการต่อแชทเดียว)');

            // ผู้บันทึก
            $table->unsignedBigInteger('created_by')->nullable()
                ->comment('ID ของพนักงานที่เพิ่ม (อ้างอิง users ใน main DB)');
            $table->string('created_by_name')->nullable()
                ->comment('ชื่อพนักงานที่เพิ่ม (เก็บไว้เผื่อ user ถูกลบ)');

            $table->boolean('is_active')->default(true)
                ->comment('เปิด/ปิดการใช้งานรายการนี้ (ปิดแทนการลบ)');

            $table->timestamps();

            $table->index('cust_id');
            $table->index('active_conversation_id');
        });
    }

    public function down(): void
    {
        Schema::connection('pgsql_kb')->dropIfExists('ai_kb_entries');
    }
};
