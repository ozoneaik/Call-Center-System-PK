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
        Schema::create('short_chats', function (Blueprint $table) {
            $table->id();
            $table->string('content')->comment('ข้อความ');
            $table->string('groups')->comment('หมวดหมู่')->nullable();
            $table->string('models')->comment('รุ่น')->nullable();
            $table->string('problems')->comment('ปัญหา')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('short_chats');
    }
};
