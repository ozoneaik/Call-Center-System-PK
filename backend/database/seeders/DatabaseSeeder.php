<?php

namespace Database\Seeders;


use App\Models\BotMenu;
use App\Models\PlatformAccessTokens;
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
                'role' => 'admin',
                'roomId' => 'ROOM00',
                'description' => 'อะไรเอ้่ย',
                'avatar' => 'https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png',
                'password' => Hash::make('1111'),
            ],
            [
                'empCode' => 'BOT',
                'name' => 'BOT',
                'email' => 'BOT@mail.local',
                'role' => 'admin',
                'roomId' => 'ROOM00',
                'description' => 'ฉันคือ BOT',
                'avatar' => 'https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png',
                'password' => Hash::make('1111'),
            ]

        ];

        foreach ($users as $user) {
            User::factory()->create($user);
        }

        PlatformAccessTokens::create([
            'accessTokenId' => '0001',
            'accessToken' => 'Token past here...',
            'description' => 'ห้องช่าง',
            'platform' => 'line'
        ]);

        $botMenus = [
            [
                'roomId' => 'ROOM02',
                'menuName' => 'ติดต่อช่าง'
            ],
            [
                'roomId' => 'ROOM03',
                'menuName' => 'ติดต่อฝ่ายประสานงาน'
            ],
            [
                'roomId' => 'ROOM04',
                'menuName' => 'ติดต่อการขาย'
            ],
            [
                'roomId' => 'ROOM01',
                'menuName' => 'อื่นๆ'
            ]
        ];

        foreach ($botMenus as $botMenu) {
            BotMenu::create($botMenu);
        }

    }
}
