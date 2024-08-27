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
            $table->string('platform')->default('line')->comment('จาก platform ไหน');
            $table->string('description')->nullable()->comment('คำอธิบายลูกค้าคนนี้');
            $table->tinyInteger('groupId')->nullable()->comment('ลูกค้าอยู่กลุ่มแชทไหน');
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
