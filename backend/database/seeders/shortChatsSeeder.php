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
        $shortChats = [
            'สวัสดีครับ มีอะไรให้ช่วยไหมครับ?',
            'ต้องการให้ช่วยอะไรบอกได้นะครับ',
            'ขอบคุณสำหรับข้อความนะครับ!',
            'กรุณารอสักครู่ ขอตรวจสอบข้อมูลก่อนครับ',
            'ลาก่อนครับ ขอให้เป็นวันที่ดีนะครับ!',
        ];

        foreach ($shortChats as $chatText) {
            short_chat::create([
                'chat_text' => $chatText,
            ]);
        }
    }
}
