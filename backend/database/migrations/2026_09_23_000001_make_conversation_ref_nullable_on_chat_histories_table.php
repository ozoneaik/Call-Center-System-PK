<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('chat_histories', function (Blueprint $table) {
            $table->integer('conversationRef')->nullable()->comment('รหัสอ้างอิงในตาราง ActiveConversations')->change();
        });
    }

    public function down()
    {
        Schema::table('chat_histories', function (Blueprint $table) {
            $table->integer('conversationRef')->nullable(false)->comment('รหัสอ้างอิงในตาราง ActiveConversations')->change();
        });
    }
};
