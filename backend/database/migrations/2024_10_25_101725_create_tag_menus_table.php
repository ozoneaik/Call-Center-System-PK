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
        Schema::create('tag_menus', function (Blueprint $table) {
            $table->id();
            $table->string('tagName')->unique()->comment('ชื่อ tag');
            $table->string('group_id')->nullable()->comment('รหัสกลุ่ม tag');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tag_menus');
    }
};
