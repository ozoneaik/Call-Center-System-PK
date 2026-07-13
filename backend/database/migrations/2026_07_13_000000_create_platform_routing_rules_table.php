<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_routing_rules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('token_id')->comment('อ้างอิง platform_access_tokens.id');
            $table->string('room_id')->comment('อ้างอิง chat_rooms.roomId');
            $table->boolean('is_allowed')->default(true)->comment('อนุญาตให้ส่งต่อไปยังห้องนี้หรือไม่');
            $table->timestamps();

            $table->foreign('token_id')->references('id')->on('platform_access_tokens')->onDelete('cascade');
            $table->unique(['token_id', 'room_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_routing_rules');
    }
};
