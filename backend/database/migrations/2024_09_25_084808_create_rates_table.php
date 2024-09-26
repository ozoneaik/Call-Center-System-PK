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
        Schema::create('rates', function (Blueprint $table) {
            $table->id();
            $table->string('custId')->comment('รหัสลูกค้า');
            $table->tinyInteger('rate')->comment('จำนวนดาวที่ลูกค้าประเมิน');
            $table->string('status')->default('pending')->comment('สถานะ');
            $table->string('latestRoomId')->comment('ห้องปัจจุบัน');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rates');
    }
};
