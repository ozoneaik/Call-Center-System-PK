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
        Schema::create('sale_information', function (Blueprint $table) {
            $table->id();
            $table->string('sale_cust_id')->uniqid();
            $table->integer('platform_id')->comment('มาจากช่องทางไหน');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_information');
    }
};
