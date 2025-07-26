<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
    'shopee' => [
        'partner_id' => env('SHOPEE_PARTNER_ID'),
        'partner_key' => env('SHOPEE_PARTNER_KEY'),
        'base_url' => env('SHOPEE_BASE_URL', 'https://partner.shopeemobile.com'),
    ],

    'lazada' => [
        'app_key' => env('LAZADA_APP_KEY'),
        'app_secret' => env('LAZADA_APP_SECRET'),
    ],

    'tiktok' => [
        'app_key'     => env('TIKTOK_APP_KEY'),
        'app_secret'  => env('TIKTOK_APP_SECRET'),
        'redirect_uri' => env('TIKTOK_REDIRECT_URI'),
        'access_token' => env('TIKTOK_ACCESS_TOKEN'),
        'shop_cipher' => env('TIKTOK_SHOPCIPHER'),
    ],
];
