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
        Schema::create('announces', function (Blueprint $table) {
            $table->id();
            $table->string('detail_text')->nullable()->comment('รายละเอียดประกาศ');
            $table->dateTime('start_at')->nullable()->comment('เริ่มใช้งาน');
            $table->dateTime('end_at')->nullable()->comment('สิ้นสุดการใช้งาน');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announces');
    }
};
