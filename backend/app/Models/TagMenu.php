<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Http\JsonResponse;

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
        'created_at'   => 'datetime',
        'updated_at'   => 'datetime',
        'deleted_at'   => 'datetime',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(TagGroup::class, 'group_id', 'group_id')->withTrashed();
    }
}
