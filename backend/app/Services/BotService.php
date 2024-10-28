<?php

namespace App\Services;

use App\Models\BotMenu;
use App\Models\ChatRooms;
use Illuminate\Support\Facades\Log;

class BotService
{
    public function list(): array
    {
        // ดึงข้อมูล botMenu พร้อม roomName และจัดกลุ่มโดยตรงในฐานข้อมูล
        $botMenus = BotMenu::select('bot_menus.*', 'chat_rooms.roomName')
            ->leftJoin('chat_rooms', 'bot_menus.roomId', '=', 'chat_rooms.roomId')
            ->get()
            ->groupBy('botTokenId');
        // สร้างอาเรย์ผลลัพธ์
        $result = $botMenus->map(function ($menus, $botTokenId) {
            return [
                'botTokenId' => $botTokenId,
                'list' => $menus,
            ];
        })->values()->all(); // ใช้ values() เพื่อ reset key ของอาเรย์
        // ดึงข้อมูล chatRooms โดยไม่รวม ROOM00
        $chatRooms = ChatRooms::where('roomId', '!=', 'ROOM00')->get();
        // สร้างผลลัพธ์สุดท้าย
        return [
            'botMenu' => $result,
            'chatRooms' => $chatRooms,
        ];
    }

    public function store($req): array
    {
        $data['status'] = false;
        try {
            $store = new BotMenu();
            $store['menuName'] = $req->input('menuName');
            $store['roomId'] = $req->input('roomId');
            if ($store->save()) {
                $data['status'] = true;
                $data['message'] = 'สร้างเมนู BOT สำเร็จ';
                $data['botMenu'] = $store;
            } else throw new \Exception('ไม่สามารถสร้าง botMenu ได้ ติดต่อฝ่ายไอที');
        } catch (\Exception $e) {
            Log::info("เกิดข้อผิดพลาด method store ใน BotService >>> {$e->getMessage()}");
            $data['message'] = $e->getMessage();
            $data['botMenu'] = [];
        } finally {
            return $data;
        }
    }

    public function update($id,$req) : array
    {
        $data['status'] = false;
        try {
            $update = BotMenu::findOrFail($id);
            $update['menuName'] = $req->input('menuName');
            $update['roomId'] = $req->input('roomId');
            if ($update->save()) {
                $data['status'] = true;
                $data['message'] = 'อัพเดท BOT สำเร็จ';
                $data['botMenu'] = $update;
            }else throw new \Exception('ไม่สามารถอัพเดท botMenu ได้ ติดต่อฝ่ายไอที');
        }catch (\Exception $e) {
            Log::info("เกิดข้อผิดพลาด method update ใน BotService >>> {$e->getMessage()}");
            $data['message'] = $e->getMessage();
            $data['botMenu'] = [];
        }finally {
            return $data;
        }
    }

    public function delete($id) : array{
        $data['status'] = false;
        try {
            $delete = BotMenu::findOrFail($id);
            if ($delete->delete()) {
                $data['status'] = true;
                $data['message'] = 'ลบ BOT สำเร็จ';
                $data['botMenu'] = $delete;
            }else throw new \Exception('ไม่สามารถลบ botMenu ได้ ติดต่อฝ่ายไอที');
        }catch (\Exception $e) {
            Log::info("เกิดข้อผิดพลาด method delete ใน BotService >>> {$e->getMessage()}");
            $data['message'] = $e->getMessage();
            $data['botMenu'] = [];
        }finally {
            return $data;
        }
    }
}
