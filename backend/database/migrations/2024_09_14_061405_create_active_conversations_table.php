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
        Schema::create('active_conversations', function (Blueprint $table) {
            $table->id();
            $table->string('custId')->comment('รหัสลูกค้า');
            $table->date('start_time')->comment('เวลาเริ่มแชท');
            $table->date('end_time')->comment('เวลาจบแชท');
            $table->string('total_time')->comment('เวลาทั้งหมดที่คุย');
            $table->string('user_code')->comment('รหัสผู้ใช้');
            $table->tinyInteger('count_chat')->comment('จำนวนแชท');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('active_conversations');
    }
};
