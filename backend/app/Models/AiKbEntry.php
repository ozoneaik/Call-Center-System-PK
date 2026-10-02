<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiKbEntry extends Model
{
    protected $connection = 'pgsql_kb';
    protected $table = 'ai_kb_entries';

    protected $fillable = [
        'question',
        'answer',
        'note',
        'source',
        'tag_name',
        'cust_id',
        'active_conversation_id',
        'message_ref',
        'answer_attachments',
        'alt',
        'created_by',
        'created_by_name',
        'is_active',
        'admin_status',
        'admin_answer',
        'admin_note',
        'approved_by',
        'approved_by_name',
        'approved_at',
    ];

    protected $casts = [
        'is_active'   => 'boolean',
        'approved_at' => 'datetime',
        'answer_attachments' => 'array',
    ];

    /**
     * ชื่อ Tag ที่ปิดเคสของ ActiveConversation นี้ (rates.tag -> tag_menus.tagName)
     * คืน null ถ้าเคสยังไม่ถูกปิด/ยังไม่ได้เลือก Tag
     */
    public static function resolveTagName(?int $activeConversationId): ?string
    {
        if (!$activeConversationId) return null;

        $ac = ActiveConversations::find($activeConversationId);
        if (!$ac || !$ac->rateRef) return null;

        $rate = Rates::find($ac->rateRef);
        if (!$rate || !$rate->tag) return null;

        return TagMenu::find($rate->tag)?->tagName;
    }

    /**
     * เติม tag_name ให้ entry ของเคสนี้ที่ยังไม่มี Tag — เรียกตอนปิดเคส (หลังบันทึก Tag ลง rates แล้ว)
     * เพราะตอนพนักงานกด "เพิ่มเข้า KB" ระหว่างแชท เคสส่วนใหญ่ยังไม่ถูกปิด จึงยังไม่รู้ Tag
     */
    public static function fillTagForConversation(int $activeConversationId): int
    {
        $tagName = self::resolveTagName($activeConversationId);
        if (!$tagName) return 0;

        return self::where('active_conversation_id', $activeConversationId)
            ->whereNull('tag_name')
            ->update(['tag_name' => $tagName]);
    }
}
