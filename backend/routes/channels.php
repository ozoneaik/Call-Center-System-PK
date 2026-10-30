<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('chat.{roomId}', function ($user, $roomId) {
    // ตรวจสอบว่า user มีสิทธิ์เข้าถึงห้องแชทนี้
    return $user->rooms->contains($roomId);
});

// แจ้งเตือนแชทใหม่ (มีข้อความและข้อมูลลูกค้า) — เป็น private channel ให้เฉพาะพนักงานที่ login แล้ว
// เดิมเป็น public channel ใครมี Pusher key (อยู่ใน JS ของหน้าเว็บ) ก็ subscribe อ่านได้
Broadcast::channel('notifications', fn ($user) => $user !== null);
Broadcast::channel('newChatRooms', fn ($user) => $user !== null);
