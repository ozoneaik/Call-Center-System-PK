<?php

// config/shopee.php
return [
    'partner_id' => env('SHOPEE_PARTNER_ID'),
    'partner_key' => env('SHOPEE_PARTNER_KEY'),
    'shop_id' => env('SHOPEE_SHOP_ID'),
    'access_token' => env('SHOPEE_ACCESS_TOKEN'),
    'refresh_token' => env('SHOPEE_REFRESH_TOKEN'),
    'base_url' => env('SHOPEE_BASE_URL', 'https://partner.shopeemobile.com'),

    // Chat API specific settings
    'chat' => [
        'default_page_size' => 20,
        'max_page_size' => 100,
        'message_types' => [
            'text',
            'image',
            'item',
            'order',
            'sticker'
        ]
    ]
];