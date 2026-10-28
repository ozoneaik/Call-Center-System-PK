<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @method static create(array $array)
 * @method static where(string $string, mixed $email)
 * @method static leftJoin(string $string, string $string1, string $string2, string $string3)
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'empCode',
        'name',
        'real_name',
        'email',
        'password',
        'role',
        'admin_menus',
        'roomId',
        'description',
        'avatar'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'admin_menus' => 'array',
        ];
    }

    /**
     * เมนูผู้ดูแลระบบที่กำหนดให้ผู้ใช้ทั่วไปได้ (key ต้องตรงกับ frontend/src/Components/adminMenus.js)
     * เมนูที่ไม่อยู่ในรายการนี้ (เช่น tokens) ใช้ได้เฉพาะ admin เท่านั้น
     */
    public const ASSIGNABLE_MENUS = [
        'keywords', 'bot_menu', 'chat_rooms', 'platform_routing', 'short_chats', 'customers',
        'users', 'help_chat', 'sticker', 'tags', 'holidays', 'knowledge_base', 'reports', 'auto_tokens',
    ];

    /** กรองเหลือเฉพาะ key ที่กำหนดให้ผู้ใช้ทั่วไปได้ — คืน null ถ้าว่าง */
    public static function sanitizeMenus($menus): ?array
    {
        $clean = array_values(array_intersect(self::ASSIGNABLE_MENUS, (array) $menus));
        return $clean ?: null;
    }

    public function canAccessMenu(string $menu): bool
    {
        if ($this->role === 'admin') return true;
        return in_array($menu, self::ASSIGNABLE_MENUS, true)
            && in_array($menu, (array) ($this->admin_menus ?? []), true);
    }
}
