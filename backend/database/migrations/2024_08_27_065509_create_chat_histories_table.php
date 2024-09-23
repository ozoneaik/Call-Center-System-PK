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
        Schema::create('chat_histories', function (Blueprint $table) {
            $table->id();
            $table->string('custId')->nullable()->comment('รหัสลูกค้า');
            $table->string('content')->nullable()->comment('ข้อความ');
            $table->string('contentType')->default('text')->comment('ประเภทข้อความ');
            $table->json('attachment')->nullable()->comment('ไฟล์ที่ส่งมา');
            $table->json('sender')->nullable()->comment('ผู้ส่ง');
            $table->string('usersReply')->nullable()->comment('พนักงานที่ส่งส่งข้อความให้ลูกค้ารายนั้นๆ');
            $table->string('platform')->default('line')->comment('ส่งจาก platform ไหน');
            $table->tinyInteger('conversationId')->nullable()->comment('id อ้างอิงจาก active_conversations');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_histories');
    }
};
