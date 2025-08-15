<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tag_menus', function (Blueprint $table) {
            // ฟิลด์ใหม่
            $table->boolean('require_note')->default(false)->comment('จำเป็นต้องกรอกหมายเหตุ');
            $table->string('created_by_user_id')->nullable();
            $table->string('updated_by_user_id')->nullable();
            $table->string('deleted_by_user_id')->nullable();
            
            // Soft delete
            $table->softDeletes(); // สร้างคอลัมน์ deleted_at (timestamp nullable)
        });
    }

    public function down(): void
    {
        Schema::table('tag_menus', function (Blueprint $table) {
            // ลบคอลัมน์ที่เพิ่มมา
            $table->dropColumn([
                'require_note',
                'created_by_user_id',
                'updated_by_user_id',
                'deleted_by_user_id',
                'deleted_at',
            ]);
        });
    }
};
