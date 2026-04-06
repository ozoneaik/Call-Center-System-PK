<?php

namespace App\Http\Controllers;

use App\Models\ChatRooms;
use App\Models\UserRooms;
use App\Services\PusherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatRoomsController extends Controller
{

    protected PusherService $pusherService;

    public function __construct(PusherService $pusherService)
    {
        $this->pusherService = $pusherService;
    }

    // public function list(): JsonResponse
    // {
    //     $user = auth()->user();
    //     $role = $user['role'];

    //     $unreadSubquery = DB::table('active_conversations')
    //         ->join('chat_histories', 'active_conversations.custId', '=', 'chat_histories.custId')
    //         ->selectRaw('count(chat_histories.id)')
    //         ->whereColumn('active_conversations.roomId', 'chat_rooms.roomId')
    //         ->whereIn('chat_histories.is_read', [0, '0', false]) // <--- เพิ่ม whereIn ดักชนิดข้อมูล
    //         ->where('chat_histories.sender', '!=', 'admin');     // <--- เพิ่มเงื่อนไขไม่นับข้อความของแอดมิน

    //     if ($role === 'admin') {
    //         $chatRooms = ChatRooms::where('chat_rooms.is_active', 1)
    //             ->select('chat_rooms.*')
    //             ->selectSub($unreadSubquery, 'is_read') // <-- ดึงข้อมูลเข้าฟิลด์ unread_count
    //             ->get();
    //     } else {
    //         $chatRooms = UserRooms::leftJoin('chat_rooms', 'user_rooms.roomId', '=', 'chat_rooms.roomId')
    //             ->where('empCode', $user['empCode'])
    //             ->where('chat_rooms.is_active', 1)
    //             ->select('chat_rooms.*', 'user_rooms.empCode')
    //             ->selectSub($unreadSubquery, 'is_read') // <-- ดึงข้อมูลเข้าฟิลด์ unread_count
    //             ->get();
    //     }

    //     // if ($role === 'admin') $chatRooms = ChatRooms::where('chat_rooms.is_active', 1)->get();
    //     // else {
    //     //     // $chatRooms = ChatRooms::all();
    //     //     $chatRooms = UserRooms::leftJoin('chat_rooms', 'user_rooms.roomId', '=', 'chat_rooms.roomId')
    //     //         ->where('empCode', $user['empCode'])
    //     //         ->where('chat_rooms.is_active', 1)
    //     //         ->get();
    //     // }

    //     $listAll = ChatRooms::where('chat_rooms.is_active', 1)->get();
    //     return response()->json([
    //         'message' => 'success',
    //         'chatRooms' => $chatRooms,
    //         'listAll' => $listAll
    //     ]);
    // }

    public function list(): JsonResponse
    {
        $user = auth()->user();
        $role = $user['role'];

        // Subquery: นับจำนวนข้อความที่ยังไม่ได้อ่าน (สำหรับ Progress)
        $unreadSubquery = DB::table('active_conversations')
            ->join('chat_histories', 'active_conversations.custId', '=', 'chat_histories.custId')
            ->selectRaw('count(chat_histories.id)')
            ->whereColumn('active_conversations.roomId', 'chat_rooms.roomId')
            ->where(function ($query) {
                $query->where('chat_histories.is_read', 0)
                    ->orWhere('chat_histories.is_read', false);
            })
            ->whereRaw('chat_histories.sender::text != ?', ['"admin"']);

        // Subquery: นับจำนวนเคส Pending (นับตามจำนวนเคส ไม่ใช่ข้อความ)
        $pendingSubquery = DB::table('active_conversations')
            ->join('rates', 'active_conversations.rateRef', '=', 'rates.id')
            ->selectRaw('count(active_conversations.id)')
            ->whereColumn('active_conversations.roomId', 'chat_rooms.roomId')
            ->where('rates.status', 'pending')
            ->whereNull('active_conversations.receiveAt');

        if ($role === 'admin') {
            $chatRooms = ChatRooms::where('chat_rooms.is_active', 1)
                ->select('chat_rooms.*')
                ->selectSub($unreadSubquery, 'unread_count')
                ->selectSub($pendingSubquery, 'pending_count')
                ->get();
        } else {
            $chatRooms = UserRooms::leftJoin('chat_rooms', 'user_rooms.roomId', '=', 'chat_rooms.roomId')
                ->where('empCode', $user['empCode'])
                ->where('chat_rooms.is_active', 1)
                ->select('chat_rooms.*', 'user_rooms.empCode')
                ->selectSub($unreadSubquery, 'unread_count')
                ->selectSub($pendingSubquery, 'pending_count')
                ->get();
        }

        $listAll = ChatRooms::where('chat_rooms.is_active', 1)->get();
        return response()->json([
            'message' => 'success',
            'chatRooms' => $chatRooms,
            'listAll' => $listAll
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
