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
        Schema::table('tag_menus', function (Blueprint $table) {
            $table->renameColumn('group', 'group_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tag_menus', function (Blueprint $table) {
            $table->renameColumn('group_id', 'group');
        });
    }
};
