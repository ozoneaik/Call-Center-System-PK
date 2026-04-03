<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    // กำหนดฟิลด์ที่อนุญาตให้บันทึกแบบ Mass Assignment
    protected $fillable = [
        'order_sn',
        'platform',
        'shop_id',
        'buyer_user_id',
        'buyer_username',
        'order_status',
        'total_amount',
        'currency',
        'order_create_time',
        'raw_data',
    ];

    // ตั้งค่าการแปลงข้อมูล (Casting)
    protected $casts = [
        'order_create_time' => 'datetime',
        'raw_data'          => 'array', // สั่งให้แปลง JSON เป็น Array อัตโนมัติ
        'total_amount'      => 'float',
    ];
}
