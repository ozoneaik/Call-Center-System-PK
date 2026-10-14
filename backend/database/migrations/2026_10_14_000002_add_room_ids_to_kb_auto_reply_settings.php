<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * room_ids: ห้อง (chat_rooms.roomId) ที่ให้ระบบ AI ตอบอัตโนมัติทำงาน — NULL/[] = ทุกห้อง
 */
return new class extends Migration
{
    protected $connection = 'pgsql_kb';

    public function up(): void
    {
        DB::connection('pgsql_kb')->statement(
            'ALTER TABLE kb_auto_reply_settings ADD COLUMN IF NOT EXISTS room_ids JSONB NULL'
        );
    }

    public function down(): void
    {
        DB::connection('pgsql_kb')->statement(
            'ALTER TABLE kb_auto_reply_settings DROP COLUMN IF EXISTS room_ids'
        );
    }
};
