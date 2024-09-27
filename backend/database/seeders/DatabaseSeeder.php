<?php

namespace Database\Seeders;

use App\Models\chatHistory;
use App\Models\LineAccessTokens;
use App\Models\PlatformAccessTokens;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'empCode' => '70010',
            'name' => 'พนักงาน ภูวเดช',
            'email' => '70010@mail.local',
            'role' => 'admin',
            'roomId' => 'ROOM0',
            'description' => 'อะไรเอ้่ย',
            'avatar' => 'https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png',
            'password' => Hash::make('1111'),
        ]);

        PlatformAccessTokens::create([
            'accessTokenId' => '0001',
            'accessToken'=> 'Token past here...',
            'description' => 'ห้องช่าง',
            'platform' => 'line'
        ]);
    }
}
