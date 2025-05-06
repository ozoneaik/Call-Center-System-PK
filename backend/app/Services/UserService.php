<?php

namespace App\Services;


use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserService
{
    protected UserRoomService $userRoomService;

    public function __construct(UserRoomService $userRoomService)
    {
        $this->userRoomService = $userRoomService;
    }

    public function getAllUsers(): Collection
    {
        return User::leftJoin('chat_rooms', 'users.roomId', '=', 'chat_rooms.roomId')
            ->select('users.*', 'chat_rooms.roomName', 'chat_rooms.roomId')->orderBy('created_at', 'DESC')
            ->get();
    }

    public function store($user): array
    {
        $data['status'] = false;
        try {
            DB::beginTransaction();
            $store = new User();
            $store['empCode'] = $user['empCode'];
            $store['name'] = $user['name'];
            $store['real_name'] = $user['real_name'];
            $store['email'] = $user['email'];
            $store['description'] = $user['description'];
            if (!empty($user['list'])) {
                $storeUserRoom = $this->userRoomService->store($user['empCode'], $user['list']);
                if (!$storeUserRoom['status']) {
                    throw new \Exception($storeUserRoom['message']);
                }
            }
            $store['role'] = $user['role'];
            $store['password'] = Hash::make($user['password']);
            if ($store->save()) {
                $data['status'] = true;
                $data['message'] = 'สร้างผู้ใช้งานใหม่สำเร็จ';
                $data['user'] = $store;
            } else throw new \Exception('เกิดข้อผิดพลาดในการสร้างผู้ใช้งานใหม่');
            DB::commit();
        } catch (QueryException $q) {
            Log::info('เกิดปัญหา ( QueryException )ที่ method store ใน UserService.php >>>');
            Log::error($q->getMessage());
            $data['message'] = $q->getMessage() ?? 'เกิดปัญหาการ query ข้อมูล';
            DB::rollBack();
        } catch (\Exception $e) {
            Log::info('เกิดปัญหาที่ method store ใน UserService.php >>>');
            Log::error($e->getMessage());
            $data['message'] = $e->getMessage();
            DB::rollBack();
        } finally {
            return $data;
        }
    }

    public function delete($empCode): array
    {
        $data['status'] = false;
        $userAuth = auth()->user();
        try {
            if ($empCode === $userAuth['empCode']) {
                throw new \Exception("คุณไม่สามารถลบคุณเองได้");
            } else {
                $delete = User::where('empCode', $empCode)->delete();
                if ($delete) {
                    $data['status'] = true;
                    $data['message'] = 'ลบผู้ใช้รหัส ' . $empCode . ' สำเร็จ';
                } else {
                    throw new \Exception('เกิดข้อผิดพลาดขณะลบ users');
                }
            }
        } catch (\Exception $e) {
            $data['status'] = false;
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }
}
