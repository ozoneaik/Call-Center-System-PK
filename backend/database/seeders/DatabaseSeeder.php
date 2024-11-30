<?php

namespace Database\Seeders;

use App\Models\BotMenu;
use App\Models\ChatRooms;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $users = [
            [
                'empCode' => '70010',
                'name' => 'พนักงาน ภูวเดช',
                'email' => '70010@mail.local',
                'role' => 'user',
                'roomId' => 'ROOM00',
                'description' => 'อะไรเอ้่ย',
                'avatar' => 'https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png',
                'password' => Hash::make('1111'),
            ],
            [
                'empCode' => 'BOT',
                'name' => 'BOT',
                'email' => 'BOT@mail.local',
                'role' => 'BOT',
                'roomId' => 'ROOM00',
                'description' => 'ฉันคือ BOT',
                'avatar' => 'https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png',
                'password' => Hash::make('1111'),
            ],
            [
                'empCode' => 'adminIT',
                'name' => 'adminIT',
                'email' => 'adminIT@mail.local',
                'role' => 'admin',
                'roomId' => 'ROOM00',
                'description' => 'ฉันคือ adminIT',
                'avatar' => 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRK-UmQwk2KEVeUvKCar5PAWslaHdpqqweFxQ&s',
                'password' => Hash::make('1111'),
            ]

        ];
        foreach ($users as $user) {
            User::factory()->create($user);
        }

        // BotMenu Seeder
        $botMenus = [
            ['roomId' => 'ROOM02', 'menuName' => 'ติดต่อช่าง','botTokenId'=> 1],
            ['roomId' => 'ROOM03', 'menuName' => 'ติดต่อฝ่ายประสานงาน','botTokenId'=> 1],
            ['roomId' => 'ROOM04', 'menuName' => 'ติดต่อการขาย','botTokenId'=> 1],
            ['roomId' => 'ROOM01', 'menuName' => 'อื่นๆ','botTokenId'=> 1]
        ];
        foreach ($botMenus as $botMenu) {
            BotMenu::create($botMenu);
        }

        // ChatRoom Seeder
        $rooms = [
            ['roomId' => 'ROOM00', 'roomName' => 'ห้องแชทบอท'],
            ['roomId' => 'ROOM01', 'roomName' => 'ห้องแชทรวม'],
            ['roomId' => 'ROOM02', 'roomName' => 'ห้องแชทช่าง'],
            ['roomId' => 'ROOM03', 'roomName' => 'ห้องแชทฝ่ายประสานงาน'],
            ['roomId' => 'ROOM04', 'roomName' => 'ห้องแชทฝ่ายประสานการขาย'],
        ];
        foreach ($rooms as $room) {
            ChatRooms::create([
                'roomId' => $room['roomId'],
                'roomName' => $room['roomName'],
                'unRead' => 1,
            ]);
        }

    }
}
