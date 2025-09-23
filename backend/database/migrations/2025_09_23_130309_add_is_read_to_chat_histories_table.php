<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_histories', function (Blueprint $table) {
            $table->boolean('is_read')
                ->nullable()
                ->default(null)
                ->comment('สถานะการอ่าน: NULL=ไม่ระบุ, false=ยังไม่ได้อ่าน, true=อ่านแล้ว')
                ->after('sender');
        });
    }

    public function down(): void
    {
        Schema::table('chat_histories', function (Blueprint $table) {
            $table->dropColumn('is_read');
        });
    }
};
