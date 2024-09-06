<?php

namespace Database\Seeders;

use App\Models\chat_rooms;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ChatRoomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        chat_rooms::create([
            'id' => 0,
            'name' => 'ห้องแชทรวม',
            'unReads' => 1,
            'status' => true
        ]);
        chat_rooms::create([
            'name' => 'ห้องแชทที่ 1',
            'unReads' => 1,
            'status' => true
        ]);
        chat_rooms::create([
            'name' => 'ห้องแชทที่ 2',
            'unReads' => 2,
            'status' => true
        ]);
        chat_rooms::create([
            'name' => 'ห้องแชทที่ 3',
            'unReads' => 3,
            'status' => true
        ]);
    }
}
