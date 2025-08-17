<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TagMenu extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tag_menus';

    protected $fillable = [
        'tagName',
        'group_id',
        'require_note',
        'created_by_user_id',
        'updated_by_user_id',
        'deleted_by_user_id',
    ];

    protected $casts = [
        'require_note' => 'boolean',
    ];

    // เชื่อมด้วย group_id (TagMenu.group_id) -> (TagGroup.group_id)
    public function group()
    {
        return $this->belongsTo(TagGroup::class, 'group_id', 'group_id')
            ->withTrashed(); // เผื่อแสดงชื่อ group แม้ถูกลบแบบ soft แล้ว
    }
}
