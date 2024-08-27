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
            $table->string('empReply')->nullable()->comment('รหัสพนักงานที่คุยกับลูกค้า');
            $table->string('textMessage')->nullable()->comment('ข้อความ');
            $table->string('platform')->default('line')->comment('ส่งจาก platform ไหน');
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
