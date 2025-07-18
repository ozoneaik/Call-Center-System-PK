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
        Schema::create('lazada_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('seller_id')->comment('Seller ID ที่ได้จาก Lazada');
            $table->string('user_id')->nullable()->comment('ระบุ user เจ้าของ token ถ้ามี');
            $table->string('account')->nullable()->comment('ชื่อร้านหรืออีเมล');
            $table->string('country')->nullable()->comment('เช่น th, sg');
            $table->string('access_token', 512);
            $table->string('refresh_token', 512);
            $table->timestamp('expired_at');
            $table->timestamp('refresh_expired_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lazada_access_tokens');
    }
};
