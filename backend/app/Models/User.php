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
        'token_platforms',
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
            'token_platforms' => 'array',
        ];
    }

    /**
     * เมนูผู้ดูแลระบบที่กำหนดให้ผู้ใช้ทั่วไปได้ (key ต้องตรงกับ frontend/src/Components/adminMenus.js)
     * เมนูที่ไม่อยู่ในรายการนี้ ใช้ได้เฉพาะ admin เท่านั้น
     */
    public const ASSIGNABLE_MENUS = [
        'keywords', 'bot_menu', 'chat_rooms', 'platform_routing', 'short_chats', 'customers',
        'users', 'help_chat', 'sticker', 'tags', 'holidays', 'knowledge_base', 'reports', 'tokens', 'auto_tokens', 'tiktok_shop',
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

    /** แพลตฟอร์มในหน้า "จัดการ token" (key ต้องตรงกับ TOKEN_PLATFORMS ใน frontend/src/Components/adminMenus.js) */
    public const TOKEN_PLATFORMS = ['line', 'facebook', 'shopee', 'lazada', 'tiktok'];

    /** กรองเหลือเฉพาะแพลตฟอร์มที่รู้จัก — คืน null (= ทุกแพลตฟอร์ม) ถ้าว่างหรือเลือกครบทุกแพลตฟอร์ม */
    public static function sanitizeTokenPlatforms($platforms): ?array
    {
        $clean = array_values(array_intersect(self::TOKEN_PLATFORMS, array_map('strtolower', (array) $platforms)));
        return ($clean && count($clean) < count(self::TOKEN_PLATFORMS)) ? $clean : null;
    }

    /** แพลตฟอร์มที่จำกัดไว้ — null = ไม่จำกัด (admin หรือยังไม่ได้กำหนด) */
    public function allowedTokenPlatforms(): ?array
    {
        if ($this->role === 'admin' || empty($this->token_platforms)) return null;
        return $this->token_platforms;
    }

    public function canAccessTokenPlatform(?string $platform): bool
    {
        $allowed = $this->allowedTokenPlatforms();
        return $allowed === null || in_array(strtolower((string) $platform), $allowed, true);
    }
}
