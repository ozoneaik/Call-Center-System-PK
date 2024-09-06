<?php

namespace Database\Seeders;

use App\Models\chatHistory;
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
            'name' => 'Test User',
            'code' => '70010',
            'email' => '70010@mail.com',
            'role' => 'admin',
            'rooms' => '[1,2,3]',
            'description' => 'อะไรเอ้่ย',
            'avatar' => 'https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png',
            'password' => Hash::make('1111'),
        ]);
    }
}
