<?php

namespace App\Services;

use App\Models\BotMenu;
use App\Models\ChatRooms;
use App\Models\PlatformAccessTokens;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BotService
{
    public function list() : array
    {
        $botMenus = PlatformAccessTokens::select(
            'platform_access_tokens.id AS botTokenId',
            'bot_menus.id', // เพิ่ม id ของ bot_menus
            'bot_menus.menuName',
            'bot_menus.roomId',
            'chat_rooms.roomName',
            'platform_access_tokens.description',
             'bot_menus.menu_number',
        )
            ->leftJoin('bot_menus', 'platform_access_tokens.id', '=', 'bot_menus.botTokenId')
            ->leftJoin('chat_rooms', 'bot_menus.roomId', '=', 'chat_rooms.roomId')
            ->orderBy('bot_menus.id', 'asc')
            ->get()
            ->groupBy('botTokenId');
        $chatRooms = ChatRooms::where('roomId', '!=', 'ROOM00')->get();
        return [
            'botMenu' => $botMenus,
            'chatRooms' => $chatRooms,
        ];
    }


    public function storeOrUpdate($req): array
    {
        $data['status'] = false;
        try {
            DB::beginTransaction();
            BotMenu::where('botTokenId',$req['botTokenId'])->delete();
            $list = $req['list'];
            $newList = [];
            foreach ($list as $item) {
                $store = new BotMenu();
                $store['botTokenId'] = $req['botTokenId'];
                $store['menuName'] = $item['menuName'];
                $store['roomId'] = $item['roomId'];
                $store['menu_number'] = $item['menu_number'];
                $store->save();
                $newList[] = $store;
            }
            $data['status'] = true;
            $data['message'] = 'สร้างเมนู BOT สำเร็จ';
            $data['botMenu'] = $newList;
            DB::commit();
        }catch (QueryException $e) {
            DB::rollBack();
            // จัดการกับ SQL Error
            Log::info("เกิดข้อผิดพลาดจาก SQL ใน method store ของ BotService >>> {$e->getMessage()}");
            return [
                'status' => false,
                'message' => 'ไม่สามารถสร้างหรือ botMenu ได้ ติดต่อฝ่ายไอที (QUERY_SQL_ERR)',
            ];
        }
        catch (\Exception $e) {
            DB::rollBack();
            Log::info("เกิดข้อผิดพลาด method store ใน BotService >>> {$e->getMessage()}");
            $data['message'] = $e->getMessage();
            $data['botMenu'] = [];
        } finally {
            return $data;
        }
    }
}
