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
        Schema::create('tiktok_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('seller_name');
            $table->string('open_id')->unique();
            $table->text('access_token');
            $table->timestamp('access_token_expire_at');
            $table->text('refresh_token');
            $table->timestamp('refresh_token_expire_at');
            $table->string('seller_base_region')->nullable();
            $table->json('granted_scopes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tiktok_tokens');
    }
};
