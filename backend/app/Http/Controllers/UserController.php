<?php

namespace App\Http\Controllers;

use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    protected UserService $userService;
    public function __construct(UserService $userService){
        $this->userService = $userService;
    }

    public function UserList() : JsonResponse{
        $users = $this->userService->getAllUsers();
        return response()->json([
            'message' => 'success',
            'users' => $users
        ]);
    }

    public function UserDelete(Request $request) : JsonResponse{
        $message = 'ไม่สามารถลบผู้ใช้รหัส '.$request->get('code').' ได้';
        $status = 400;
        try {
            $code = $request->get('code');
            $user = $this->userService->delete($code);
            if ($user) {
                $status = 200;
                $message = 'ลบผู้ใช้รหัส '.$request->get('code').' สำเร็จ';
            }
        }catch (\Exception $exception){
            $status = 500;
            $message = $exception->getMessage();
        }
        return response()->json([
            'message' => $message,
        ],$status);
    }
}
