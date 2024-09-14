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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('custId')->unique()->comment('รหัสลูกค้า');
            $table->string('name')->comment('ชื่อบัญชีลูกค้า');
            $table->string('description')->nullable()->comment('คำอธิบายลูกค้าคนนี้');
            $table->string('avatar')->comment('รูปโปรไฟล์');
            $table->string('platform')->default('line')->comment('จาก platform ไหน');
            $table->boolean('online')->default(1)->nullable()->comment('สถานะออนไลน์');
            $table->tinyInteger('roomId')->nullable()->comment('ลูกค้าอยู่กลุ่มแชทไหน');
            $table->string('userReply')->nullable()->comment('คุยกับ user คนไหน');
            $table->string('status')->default('pending')->comment('สถานะการคุยของแชทนี้');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
