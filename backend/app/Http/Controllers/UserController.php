<?php

namespace App\Http\Controllers;

use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    protected UserService $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    public function UserList(): JsonResponse
    {
        $users = $this->userService->getAllUsers();
        return response()->json([
            'message' => 'success',
            'users' => $users
        ]);
    }

    public function UserDelete($empCode): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $user = $this->userService->delete($empCode);
            if ($user['status']) {
                $status = 200;
                $message = $user['message'];
            } else throw new \Exception($user['message']);
        } catch (\Exception $exception) {
            $detail = $exception->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail' => $detail
            ], $status);
        }
    }
}
