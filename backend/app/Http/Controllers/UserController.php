<?php

namespace App\Http\Controllers;

use App\Services\UserService;
use Illuminate\Http\JsonResponse;

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
}
