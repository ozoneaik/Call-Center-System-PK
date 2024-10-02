<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('custId')->comment('รหัสลูกค้า');
            $table->string('custName')->comment('ชื่อลูกค้า');
            $table->string('description')->nullable()->default('ไม่มีคำอธิบาย')->comment('คำอธิบาย');
            $table->string('avatar')->comment('รูปโปรไฟล์')->nullable();
            $table->string('platformRef')->comment('accessToken เพื่อจับกับ token');
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
