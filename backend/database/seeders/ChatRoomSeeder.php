<?php

namespace Database\Seeders;

use App\Models\ChatRooms;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ChatRoomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        ChatRooms::create([
            'roomId' => 'ROOM00',
            'roomName' => 'ห้องแชทบอท',
            'unRead' => 1,
        ]);
        ChatRooms::create([
            'roomId' => 'ROOM01',
            'roomName' => 'ห้องแชทรวม',
            'unRead' => 1,
        ]);
        ChatRooms::create([
            'roomId' => 'ROOM02',
            'roomName' => 'ห้องแชทช่าง',
            'unRead' => 1,
        ]);
        ChatRooms::create([
            'roomId' => 'ROOM03',
            'roomName' => 'ห้องแชทฝ่ายประสานงาน',
            'unRead' => 1,
        ]);
        ChatRooms::create([
            'roomId' => 'ROOM04',
            'roomName' => 'ห้องแชทฝ่ายประสานการขาย',
            'unRead' => 1,
        ]);
    }
}
