<?php

/**
 * ShoAPI Configuration
 */
return [

    'shop' => [
        'get_shop_info' => [
            'method' => 'GET',
            'path'   => '/api/v2/shop/get_shop_info',
        ],
    ],

    'auth' => [
        'get_access_token' => [
            'method' => 'POST',
            'path'   => '/api/v2/auth/token/get',
        ],
        'refresh_access_token' => [
            'method' => 'POST',
            'path'   => '/api/v2/auth/access_token/get',
        ],
    ],

    // 🟢 เพิ่มตรงนี้
    'chat' => [
        'send_message' => [
            'method' => 'POST',
            'path'   => '/api/v2/chat/send_message',
        ],
    ],

];
