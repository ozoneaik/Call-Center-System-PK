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
            $table->string('roomId')->comment('รหัสห้อง');
            $table->dateTime('receiveAt')->nullable()->comment('วันที่รับงาน');
            $table->dateTime('startTime')->nullable()->comment('เริ่มสนทนา');
            $table->dateTime('endTime')->nullable()->comment('จบสนทนา');
            $table->string('totalTime')->nullable()->comment('เวลาสนทนารวม');
            $table->string('from_empCode')->nullable()->comment('ส่งต่อมาจากพนักงานคนไหน');
            $table->string('from_roomId')->nullable()->comment('ส่งต่อมาจากห้องไหน');
            $table->string('empCode')->comment('พนักงานที่รับเรื่อง');
            $table->integer('rateRef')->comment('รหัสอ้างอิงไปยังตาราง Rates');
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
