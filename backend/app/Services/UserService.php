<?php
namespace App\Services;


use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class UserService{
    public function getAllUsers(): Collection
    {
        return User::leftJoin('chat_rooms','users.roomId','=','chat_rooms.roomId')
            ->select('users.*','chat_rooms.roomName','chat_rooms.roomId')->orderBy('created_at','DESC')
            ->get();
    }

    public function delete($empCode) : array{
        $data['status'] = false;
        $userAuth = auth()->user();

        try {
            if ($empCode === $userAuth['empCode']){
                throw new \Exception("คุณไม่สามารถลบคุณเองได้");
            }else{
                $delete = User::where('empCode', $empCode)->delete();
                if ($delete){
                    $data['status'] = true;
                    $data['message'] = 'ลบผู้ใช้รหัส '.$empCode.' สำเร็จ';
                }else{
                    throw new \Exception('เกิดข้อผิดพลาดขณะลบ users');
                }
            }
        }catch (\Exception $e){
            $data['status'] = false;
            $data['message'] = $e->getMessage();
        }finally{
            return $data;
        }
    }
}
