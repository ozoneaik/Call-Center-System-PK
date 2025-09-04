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
        Schema::create('default_rooms', function (Blueprint $table) {
            $table->id();
            $table->integer('platform_id')->comment('ID ของแพลตฟอร์มที่ห้องนี้ถูกสร้างขึ้น');
            $table->integer('room_id')->comment('รหัสห้องที่จะให้ไปอยู่');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('default_rooms');
    }
};
