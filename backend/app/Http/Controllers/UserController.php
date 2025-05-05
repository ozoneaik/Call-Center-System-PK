<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Models\UserRooms;
use App\Services\AuthService;
use App\Services\UserRoomService;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    protected UserService $userService;
    protected AuthService $authService;
    protected UserRoomService $userRoomService;

    public function __construct(UserService $userService, AuthService $authService, UserRoomService $userRoomService)
    {
        $this->userService = $userService;
        $this->authService = $authService;
        $this->userRoomService = $userRoomService;
    }

    public function UserList(): JsonResponse
    {
        // Retrieve all users and convert each user to an array for easy modification
        $users = $this->userService->getAllUsers()->toArray();
        $userRooms = UserRooms::all();

        // Create an associative array to map employee codes to room IDs
        $roomMapping = [];
        foreach ($userRooms as $userRoom) {
            $roomMapping[$userRoom['empCode']][] = $userRoom['roomId'];
        }

        // Iterate through each user and add room information
        foreach ($users as &$user) {
            // Add the list of room IDs to each user, if available
            $user['list'] = $roomMapping[$user['empCode']] ?? [];
        }

        // Return the response as JSON
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

    public function UserStore(RegisterRequest $request): JsonResponse
    {
        $status = 400;
        try {
            $user = $this->userService->store($request);
            if ($user['status']) {
                $status = 200;
                $message = 'เสร็จสิ้น';
                $detail = $user['message'];
            }else throw new \Exception($user['message']);
        } catch (\Exception $exception) {
            $detail = $exception->getMessage();
            $user = [];
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail' => $detail,
                'user' => $user,
            ],$status);
        }
    }

    public function UserUpdate($empCode, Request $request): JsonResponse
    {

        $detail = 'ไม่พบข้อผิดพลาด';
        $status = 400;
        try {
            DB::beginTransaction();
            $user = User::where('empCode', $empCode)->first();
            $user['name'] = $request['name'];
            $user['description'] = $request['description'];
            $user['role'] = $request['role'];
            $updateUserRoom = $this->userRoomService->store($user['empCode'], $request['list']);
            if (!$updateUserRoom['status']) {
                throw new \Exception($updateUserRoom['message']);
            }
            $user['roomId'] = $request['roomId'];
            if (!empty($request['password'])) {
                $user['password'] = Hash::make($request['password']);
            }
            if ($user->update()) {
                $message = 'อัพเดทข้อมูลเสร็จสิ้น';
            } else throw new \Exception('ไม่สามารถอัพเดทได้');
            $status = 200;
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail' => $detail
            ], $status);
        }
    }


    public function profile(){
        $user = auth()->user();
        return response()->json([
            'profile' => $user
        ]);
    }

    public function updateProfile(Request $request){
        try{
            $user = User::where('empCode', Auth::user()->empCode)->first();
            $user->name = $request['name'];
            $user->description = $request['description'];
            if (isset($request['avatar'])) {
                $avatarBase64 = $request['avatar'];
                if (preg_match('/^data:image\/(\w+);base64,/', $avatarBase64, $type)) {
                    $image = substr($avatarBase64, strpos($avatarBase64, ',') + 1);
                    $image = str_replace(' ', '+', $image);
                    $imageType = strtolower($type[1]);
                    $imageName = 'avatar_' . uniqid() . '.' . $imageType;
                    $imagePath = 'profile/' . $imageName;
                    Storage::disk('public')->put($imagePath, base64_decode($image));
                    $fullPath = asset('storage/' . $imagePath);
                    $user->avatar = $fullPath;
                } else {
                    throw new \Exception('รูปภาพไม่อยู่ในรูปแบบ base64 ที่ถูกต้อง');
                }
            }
            $user->save();
            return response()->json([
                'request' => $request->all(),
                'user' => $user,
            ]);
        }catch (\Exception $e){
            return response()->json([
                'message' => 'เกิดข้อผิดพลาด',
                'detail' => $e->getMessage()
            ],400);
        }
    }
}
