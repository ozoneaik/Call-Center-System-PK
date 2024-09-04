<?php

namespace Database\Seeders;

use App\Models\short_chat;
use Illuminate\Database\Seeder;

class shortChatsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        short_chat::create([
            'chat_text' => 'สวัสดีครับ มีอะไรให้ช่วยไหมครับ?',
        ]);

        short_chat::create([
            'chat_text' => 'ต้องการให้ช่วยอะไรบอกได้นะครับ',
        ]);

        short_chat::create([
            'chat_text' => 'ขอบคุณสำหรับข้อความนะครับ!',
        ]);

        short_chat::create([
            'chat_text' => 'กรุณารอสักครู่ ขอตรวจสอบข้อมูลก่อนครับ',
        ]);

        short_chat::create([
            'chat_text' => 'ลาก่อนครับ ขอให้เป็นวันที่ดีนะครับ!',
        ]);
    }
}
