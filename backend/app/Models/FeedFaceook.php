<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * // * @method static select(string $string, string $string1)
 * @method static findOrFail($id)
 * @method static where(string $string, mixed $botTokenId)*@method static select(string$string)
 */
class FeedFaceook extends Model
{
    use HasFactory;

    protected $fillable = ['pageId', 'message', 'fullPicture','createdTime','postId','likesCount','commentsCount','sharesCount'];
}
