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
        Schema::create('tag_by_platforms', function (Blueprint $table) {
            $table->id();
            $table->string('platform_name')->comment('ชื่อแพลตฟอร์ม');
            $table->integer('tag_id')->comment('ไอดีแท็ก');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tag_by_platforms');
    }
};
