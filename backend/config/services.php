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

    // AI ผู้ช่วยตอบสด (chat-oc-summary) — backend เรียกแทน frontend เพราะ browser บล็อกการยิงตรงไป loopback/CORS
    // เดิมยิง chat-oc-any (ส่งได้ทีละ 1 ข้อความ + รูป) เปลี่ยนมาใช้ chat-oc-summary (ส่ง context หลายข้อความ
    // เป็น array "lines" ให้ AI สรุปได้) — endpoint ใหม่นี้ไม่รับไฟล์รูปแนบแล้ว
    'chat_oc_summary' => [
        'url' => env('CHAT_OC_SUMMARY_URL', 'http://192.168.9.32:7001/chat-oc-summary'),
    ],

];
