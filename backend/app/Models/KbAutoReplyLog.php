<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * บันทึกการตัดสินใจของระบบ AI ตอบอัตโนมัติ — 1 แถวต่อ 1 ข้อความลูกค้าที่ระบบพิจารณา
 * decision: sent / would_send / send_failed / below_threshold / ambiguous / no_candidate /
 *           skipped (ไม่เข้าเงื่อนไขก่อนค้นหา เช่น พนักงานรับเรื่องแล้ว — ดู reason) / error
 */
class KbAutoReplyLog extends Model
{
    protected $connection = 'pgsql_kb';
    protected $table = 'kb_auto_reply_logs';

    protected $fillable = [
        'cust_id', 'active_conversation_id', 'chat_history_id', 'platform', 'room_id',
        'customer_message', 'ai_query', 'ai_summary', 'ai_similarity', 'ai_knowledgefrom',
        'matched_entry_id', 'matched_score', 'matched_by', 'second_entry_id', 'second_score',
        'mode', 'decision', 'reason',
    ];

    protected $casts = [
        'ai_similarity' => 'float',
        'matched_score' => 'float',
        'second_score'  => 'float',
    ];
}
