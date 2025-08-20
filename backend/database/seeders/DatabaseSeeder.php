<?php

namespace Database\Seeders;

use App\Models\BotMenu;
use App\Models\ChatRooms;
use App\Models\Keyword;
use App\Models\TagMenu;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'empCode' => 'BOT',
                'name' => 'BOT',
                'email' => 'BOT@mail.local',
                'role' => 'BOT',
                'roomId' => 'ROOM00',
                'description' => 'ฉันคือ BOT',
                'avatar' => 'https://images.pumpkin.tools/BOT.png',
                'password' => Hash::make('1111'),
            ],
            [
                'empCode' => 'BOT_FACEBOOK',
                'name' => 'BOT_FACEBOOK',
                'email' => 'BOT_FACEBOOK@mail.local',
                'role' => 'BOT',
                'roomId' => 'ROOM00',
                'description' => 'ฉันคือ BOT_FACEBOOK',
                'avatar' => 'https://call-center-pk.s3.ap-southeast-1.amazonaws.com/61621754792643.png',
                'password' => Hash::make('1111'),
            ],
            [
                'empCode' => 'adminIT',
                'name' => 'adminIT',
                'email' => 'adminIT@mail.local',
                'role' => 'admin',
                'roomId' => 'ROOM00',
                'description' => 'ฉันคือ adminIT',
                'avatar' => 'https://images.pumpkin.tools/UserLogo.jpg',
                'password' => Hash::make('1111'),
            ]

        ];
        foreach ($users as $user) {
            User::factory()->create($user);
        }

        // BotMenu Seeder
        $botMenus = [
            ['roomId' => 'ROOM02', 'menuName' => 'ติดต่อช่าง', 'botTokenId' => 1, 'menu_number' => 1],
            ['roomId' => 'ROOM03', 'menuName' => 'ติดต่อฝ่ายประสานงาน', 'botTokenId' => 1, 'menu_number' => 2],
            ['roomId' => 'ROOM04', 'menuName' => 'ติดต่อการขาย', 'botTokenId' => 1, 'menu_number' => 3],
            ['roomId' => 'ROOM01', 'menuName' => 'อื่นๆ', 'botTokenId' => 1, 'menu_number' => 4],
            ['roomId' => 'ROOM02', 'menuName' => 'ติดต่อช่าง', 'botTokenId' => 2, 'menu_number' => 1],
            ['roomId' => 'ROOM04', 'menuName' => 'customer service', 'botTokenId' => 2, 'menu_number' => 2],
            ['roomId' => 'ROOM01', 'menuName' => 'อื่นๆ', 'botTokenId' => 2, 'menu_number' => 3],
        ];
        foreach ($botMenus as $botMenu) {
            BotMenu::query()->create($botMenu);
        }

        // ChatRoom Seeder
        $rooms = [
            ['roomId' => 'ROOM00', 'roomName' => 'ห้องแชทบอท'],
            ['roomId' => 'ROOM01', 'roomName' => 'ห้องแชทรวม'],
            ['roomId' => 'ROOM02', 'roomName' => 'ห้องแชทช่าง'],
            ['roomId' => 'ROOM03', 'roomName' => 'ห้องแชทฝ่ายประสานงาน'],
            ['roomId' => 'ROOM04', 'roomName' => 'ห้องแชทฝ่ายประสานการขาย'],
            ['roomId' => 'ROOM05', 'roomName' => 'ฝ่ายบุคคล'],
            ['roomId' => 'ROOM06', 'roomName' => 'Customer Service'],
            ['roomId' => 'ROOM99', 'roomName' => 'ห้องเริ่มต้น'],
        ];
        foreach ($rooms as $room) {
            ChatRooms::query()->create([
                'roomId' => $room['roomId'],
                'roomName' => $room['roomName'],
                'unRead' => 1,
            ]);
        }

        $tag_menus = [
            ['tagName' => 'ปิดงานสแปม'],
            ['tagName' => 'ปิดงานทั่วไป'],
        ];
        foreach ($tag_menus as $tag_menu) {
            TagMenu::query()->create($tag_menu);
        }

        $keywords = [
            ['name' => 'ขอบคุณครับ', 'event' => true,'redirectTo' => null],
            ['name' => 'ช่าง', 'event' => false,'redirectTo' => 'ROOM02'],
        ];
        foreach ($keywords as $keyword){
            Keyword::query()->create($keyword);
        }


    }
}
