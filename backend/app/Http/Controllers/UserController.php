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
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail' => $detail,
                'user' => $user,
            ]);
        } catch (\Exception $exception) {
            $status = 400;
            $detail = $exception->getMessage();
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail' => $detail,
                'user' => [],
            ],$status ?? 500);
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
            $user['admin_menus'] = $request['role'] === 'admin' ? null : User::sanitizeMenus($request['admin_menus'] ?? []);
            $user['token_platforms'] = $request['role'] === 'admin' ? null : User::sanitizeTokenPlatforms($request['token_platforms'] ?? []);
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

    /** ชนิดรูปโปรไฟล์ที่รับ => นามสกุลไฟล์ที่บันทึก */
    private const AVATAR_TYPES = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    private const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

    /**
     * รับรูปแบบ data URL (base64) — ตรวจชนิดจากเนื้อไฟล์จริง และตั้งนามสกุลเอง
     * ห้ามใช้ชนิดจาก "data:image/xxx" ที่ผู้ใช้ส่งมา (เคยทำให้อัปโหลดไฟล์ .php ลง public storage ได้)
     */
    private function storeAvatar(string $dataUrl): string
    {
        if (!preg_match('/^data:image\/[a-z0-9.+-]+;base64,/i', $dataUrl)) {
            throw new \Exception('รูปภาพไม่อยู่ในรูปแบบ base64 ที่ถูกต้อง');
        }
        $binary = base64_decode(str_replace(' ', '+', substr($dataUrl, strpos($dataUrl, ',') + 1)), true);
        if ($binary === false || $binary === '') throw new \Exception('รูปภาพไม่อยู่ในรูปแบบ base64 ที่ถูกต้อง');
        if (strlen($binary) > self::AVATAR_MAX_BYTES) throw new \Exception('รูปโปรไฟล์ต้องมีขนาดไม่เกิน 2 MB');

        $mime = (new \finfo(FILEINFO_MIME_TYPE))->buffer($binary);
        $extension = self::AVATAR_TYPES[$mime] ?? null;
        if (!$extension || @getimagesizefromstring($binary) === false) {
            throw new \Exception('รองรับเฉพาะรูป jpg, png, webp');
        }

        $imagePath = 'profile/avatar_' . uniqid() . '.' . $extension;
        Storage::disk('public')->put($imagePath, $binary);
        return asset('storage/' . $imagePath);
    }

    public function updateProfile(Request $request){
        try{
            $user = User::where('empCode', Auth::user()->empCode)->first();
            $user->name = $request['name'];
            $user->description = $request['description'];
            if (isset($request['avatar'])) {
                $user->avatar = $this->storeAvatar((string) $request['avatar']);
            }
            $user->save();
            return response()->json([
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
