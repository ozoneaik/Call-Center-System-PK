<?php

namespace App\Http\Controllers;

use App\Models\ChatRooms;
use App\Services\PusherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatRoomsController extends Controller
{

    protected PusherService $pusherService;

    public function __construct(PusherService $pusherService)
    {
        $this->pusherService = $pusherService;
    }

    public function list(): JsonResponse
    {
        $user = auth()->user();
        $role = $user['role'];
        $roomId = $user['roomId'];
        if ($role === 'admin') $chatRooms = ChatRooms::all();
        else $chatRooms = ChatRooms::where('roomId', $roomId)->orWhere('roomId', 'ROOM01')->get();
        return response()->json([
            'message' => 'success',
            'chatRooms' => $chatRooms
        ]);

    }

    public function store(Request $request): JsonResponse
    {
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            if ($request['roomId']) {
                // อัปเดต ChatRoom ที่มีอยู่แล้ว
                $update = ChatRooms::where('roomId', $request['roomId'])->first();
                if (!$update) {
                    throw new \Exception('ไม่พบห้องที่ต้องการอัปเดต');
                }
                $update->roomName = $request['roomName'];
                $update->save(); // ใช้ save() แทน update() ในกรณีนี้
            } else {
                // สร้างห้องใหม่
                $latest = ChatRooms::latest('id')->first();
                $latestId = $latest ? intval(substr($latest->roomId, 4)) + 1 : 1;
                $newRoomId = 'ROOM' . str_pad($latestId, 2, '0', STR_PAD_LEFT);

                // เพิ่มห้องใหม่
                $store = new ChatRooms();
                $store['roomName'] = $request['roomName'];
                $store['unRead'] = 0;
                $store['roomId'] = $newRoomId;
                $store->save();
            }

            $status = 200;
            $message = 'บันทึกข้อมูลสำเร็จ';
        } catch (\Exception $e) {
            $status = 400;
            $detail = $e->getMessage();
            $message = 'เกิดข้อผิดพลาด';
        } finally {
            return response()->json([
                'message' => $message,
                'detail' => $detail,
            ], $status);
        }
    }


    public function delete($roomId): JsonResponse
    {
        try {
            // ค้นหาห้องที่ต้องการลบ
            $room = ChatRooms::where('roomId', $roomId)->first();

            // ตรวจสอบว่าพบห้องหรือไม่
            if (!$room) {
                return response()->json([
                    'message' => "ไม่พบห้องที่มี roomId: $roomId",
                ], 404);
            }

            // ลบห้อง
            $room->delete();

            // ส่งข้อความเมื่อทำการลบสำเร็จ
            return response()->json([
                'message' => "ลบห้องที่มี roomId: $roomId สำเร็จ",
            ], 200);

        } catch (\Exception $e) {
            // กรณีเกิดข้อผิดพลาด
            return response()->json([
                'message' => 'เกิดข้อผิดพลาดในการลบห้อง',
                'detail' => $e->getMessage(),
            ], 500);
        }
    }

}
