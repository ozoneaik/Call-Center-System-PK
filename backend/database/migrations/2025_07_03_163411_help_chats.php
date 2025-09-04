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
        Schema::create('help_chats', function (Blueprint $table) {
            $table->id();
            $table->string('search')->nullable();
            $table->text('problem')->nullable();
            $table->text('solve')->nullable();
            $table->string('sku')->nullable();
            $table->string('model')->nullable();
            $table->text('remark')->nullable();
            $table->text('search_vector')->nullable();
            $table->string('skugroup')->nullable();
            $table->text('cause')->nullable();
            $table->timestamps();

            // Index for full-text search
            $table->index(['search_vector'], 'idx_help_chats_search_vector');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
