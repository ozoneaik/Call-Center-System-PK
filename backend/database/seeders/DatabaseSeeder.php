<?php

namespace Database\Seeders;

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
            'code' => 'test',
            'email' => 'test@gmail.com',
            'role' => 'admin',
            'groups' => '["1","2","3"]',
            'password' => Hash::make('1111'),
        ]);
    }
}
