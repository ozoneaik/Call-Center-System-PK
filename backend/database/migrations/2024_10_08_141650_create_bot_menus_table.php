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
        Schema::create('bot_menus', function (Blueprint $table) {
            $table->id();
            $table->integer('botTokenId')->comment('ไอดี accessToken');
            $table->string('menuName')->comment('ชื่อรายการเมนู');
            $table->string('roomId')->nullable()->comment('ห้องแชท');
            $table->integer('menu_number')->nullable()->comment('ลําดับเมนู');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bot_menus');
    }
};
