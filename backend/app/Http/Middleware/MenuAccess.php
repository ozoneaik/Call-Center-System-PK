<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * กั้นสิทธิ์ API ตามเมนูผู้ดูแลระบบ — ใช้ใน route เป็น ->middleware('menu:<key>')
 * admin ผ่านทุกเมนู, ผู้ใช้ทั่วไปผ่านเฉพาะเมนูที่ได้รับอนุญาตใน users.admin_menus (ดู User::canAccessMenu)
 */
class MenuAccess
{
    public function handle(Request $request, Closure $next, string $menu): Response
    {
        $user = $request->user();
        if (!$user || !$user->canAccessMenu($menu)) {
            return response()->json([
                'message' => 'เกิดข้อผิดพลาด',
                'detail'  => 'คุณไม่มีสิทธิ์ใช้งานเมนูนี้ (รหัส 403)',
            ], 403);
        }
        return $next($request);
    }
}
