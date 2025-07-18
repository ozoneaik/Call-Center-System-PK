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
            $table->string('custId')->comment('รหัสลูกค้า');
            $table->text('content')->comment('ข้อความ');
            $table->string('contentType')->comment('ประเภทข้อความ');
            $table->json('sender')->comment('ผู้ส่ง');
            $table->integer('conversationRef')->comment('รหัสอ้างอิงในตาราง ActiveConversations');
            $table->text('line_message_id')->nullable()->comment('id ของข้อความไลน์');
            $table->text('line_quote_token')->nullable()->comment('token สำหรับการตอบกลับ');
            $table->text('line_quoted_message_id')->nullable()->comment('ว่าเป็นข้อความที่ตอบกลับหรือไม่');
            $table->text('facebook_message_id')->nullable()->comment('id ข้อความ facebook');
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
