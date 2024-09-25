<?php

namespace Database\Seeders;

use App\Models\ShortChats;
use Illuminate\Database\Seeder;

class ShortChatsSeeder extends Seeder
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
            ShortChats::create([
                'content' => $chatText,
            ]);
        }
    }
}
