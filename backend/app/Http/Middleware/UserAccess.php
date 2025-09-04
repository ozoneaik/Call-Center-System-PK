<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;


class UserAccess
{
    /**
     * Handle an incoming request.
     *
     * @param Closure(Request): (Response) $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->user()->role !== 'admin') {
            return \response()->json([
                'message' => 'เกิดข้อผิดพลาด',
                'detail' => 'สิทธิ์ของคุณไม่ได้เป็น ผู้ดูแลระบบ (รหัส 403)'
            ], 403);
        }else return $next($request);
    }
}
