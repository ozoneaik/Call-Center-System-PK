<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HelpChatModel extends Model
{
    use HasFactory;

    protected $table = 'help_chats';

    protected $fillable = [
        'search',
        'problem',
        'solve',
        'sku',
        'model',
        'remark',
        'search_vector',
        'skugroup',
        'cause'
    ];
}
