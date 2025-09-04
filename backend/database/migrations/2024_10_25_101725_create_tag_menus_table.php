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
            $table->boolean('require_note')->default(false)->comment('บังคับกรอกมั้ย');
            $table->string('created_by_user_id')->nullable()->comment('ผู้สร้าง');
            $table->string('updated_by_user_id')->nullable()->comment('ผู้แก้ไข');
            $table->string('deleted_by_user_id')->nullable()->comment('ผู้ลบ');
            $table->softDeletes();
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
