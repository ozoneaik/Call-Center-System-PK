<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Services\AuthService;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    protected UserService $userService;
    protected AuthService $authService;

    public function __construct(UserService $userService, AuthService $authService)
    {
        $this->userService = $userService;
        $this->authService = $authService;
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

    public function UserStore(RegisterRequest $request)
    {
        $user = $this->authService->register($request);
        return response()->json([
            'message' => 'Register successfully',
            'user' => $user,
        ]);
    }

    public function UserUpdate($empCode, Request $request): JsonResponse
    {

        $detail = 'ไม่พบข้อผิดพลาด';
        try {
            DB::beginTransaction();
            $user = User::where('empCode', $empCode)->first();
            $user['name'] = $request->get('name');
            $user['description'] = $request->get('description');
            $user['role'] = $request->get('role');
            $user['roomId'] = $request->get('roomId');
            if (!empty($request->get('password'))) {
                $user['password'] = Hash::make($request->get('password'));
            }
            if ($user->update()) DB::commit();
            else throw new \Exception('ไม่สามารถอัพเดทได้');
            $status = 200;
        } catch (\Exception $e) {
            DB::rollBack();
            $detail = $e->getMessage();
            $status = 400;
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail' => $detail
            ], $status);
        }
    }
}
