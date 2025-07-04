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
        Schema::create('platform_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('accessTokenId')->unique()->comment('รหัสอ้างอิง');
            $table->string('accessToken', 512)->unique()->comment('channel access token');
            $table->string('description')->comment('คำอธิบาย token');
            $table->string('platform')->comment('จากแพลตฟอร์มไหน');
            $table->string('page_id')->nullable()->comment('id pags facebook');TokenPages
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_access_tokens');
    }
};
