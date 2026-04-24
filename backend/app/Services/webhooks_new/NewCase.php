<?php

namespace App\Services\webhooks_new;

use App\Models\ActiveConversations;
use App\Models\BotMenu;
use App\Models\ChatHistory;
use App\Models\Rates;
use App\Services\PusherService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NewCase
{

    protected CheckKeyword $checkKeyword;
    protected PusherService $pusherService;
    protected ArchitectService $architectService;

    public function __construct(CheckKeyword $checkKeyword, PusherService $pusherService, ArchitectService $architectService)
    {
        $this->checkKeyword = $checkKeyword;
        $this->pusherService = $pusherService;
        $this->architectService = $architectService;
    }

    // public function case($message, $customer, $platformAccessToken, $bot)
    // {
    //     try {
    //         Log::channel('webhook_main')->info('ปัจจุบันเป็นเคสใหม่ ไม่เคยสร้างเคส');
    //         $now = Carbon::now();

    //         // เช็คข้อความลูกค้าว่าตรงตาม keyword หรือไม่ ถ้าตรงให้่ส่งไปยังห้องนั้นๆ
    //         $keyword = $this->checkKeyword->check($message);
    //         if ($keyword['status']) {
    //             $new_rate = Rates::query()->create([
    //                 'custId' => $customer['custId'],
    //                 'latestRoomId' => $keyword['redirectTo'],
    //                 'status' => 'pending',
    //                 'rate' => 0,
    //             ]);
    //         } else {
    //             $new_rate = Rates::query()->create([
    //                 'custId' => $customer['custId'],
    //                 'latestRoomId' => 'ROOM00',
    //                 'status' => 'progress',
    //                 'rate' => 0,
    //             ]);
    //         }

    //         $new_ac = ActiveConversations::query()->create([
    //             'custId' => $customer['custId'],
    //             'roomId' => $new_rate['latestRoomId'],
    //             'receiveAt' => $new_rate['status'] === 'pending' ? null : $now,
    //             'startTime' => $new_rate['status'] === 'pending' ? null : $now,
    //             'empCode' => $bot['empCode'],
    //             'rateRef' => $new_rate['id']
    //         ]);
    //         $store_chat = ChatHistory::query()->create([
    //             'custId' => $customer['custId'],
    //             'content' => $message['content'],
    //             'contentType' => $message['contentType'],
    //             'sender' => json_encode($customer),
    //             'conversationRef' => $new_ac['id'],
    //             'line_message_id' => $message['line_quote_token'] ?? null,
    //             'line_quote_token' => $message['line_quote_token'] ?? null,
    //             'line_quoted_message_id' => $message['line_quoted_message_id'] ?? null,
    //         ]);
    //         $this->pusherService->sendNotification($customer['custId']);

    //         $msg_bot = [];

    //         $now = Carbon::now();
    //         $startHoliday = Carbon::create($now->year, 12, 31, 0, 0, 0);
    //         $endHoliday   = Carbon::create($now->year + 1, 1, 1, 23, 59, 59);

    //         // เช็คว่า อยู่ห้องไหน ถ้าอยู่ห้องบอท ให้ ส่งเมนูไป ถ้าไม่ใช่ ให้ส่งข้อความ ระบบได้ส่งให้เจ้าหน้าที่กรุณารอสักครู่
    //         if ($new_rate['latestRoomId'] === 'ROOM00') {
    //             // $content = "สวัสดีคุณ" . $customer['custName'];
    //             // $content = $content . "เพื่อให้การบริการของเราดำเนินไปอย่างรวดเร็วและสะดวกยิ่งขึ้น";
    //             // $content = $content . "กรุณาเลือกหัวข้อด้านล่าง เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลและบริการท่านได้อย่างถูกต้องและรวดเร็ว ขอบคุณค่ะ/ครับ";

    //             // $content = $content . "เนื่องจาก ในวันที่ 30/08/2568 - 01/09/2568 ทางบริษัทมีการจัดสัมนาประจำปี";
    //             // $content = $content . "จึงทำให้การให้ข้อมูลคุณลูกค้าอาจจะล่าช้ากว่าปกติ จึงขออภัยมา ณ ที่นี่ด้วย";
    //             // $content = $content . "เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลท่านได้ถูกต้อง กรุณาเลือก เมนู ที่ท่านต้องการติดต่อ";

    //             if ($now->between($startHoliday, $endHoliday)) {
    //                 $content = "เรียน ลูกค้าทุกท่าน บริษัท พัมคิน (PUMPKIN) ขอแจ้งวันหยุดทำการดังนี้ครับ/ค่ะ\n";
    //                 $content .= "❌ ปิดทำการ: วันที่ 31 ธ.ค. - 1 ม.ค.\n";
    //                 $content .= "✅ เปิดให้บริการตามปกติ: วันที่ 2 ม.ค. เป็นต้นไป\n\n";
    //                 $content .= "ขอบพระคุณลูกค้าทุกท่านที่ไว้วางใจในสินค้าพัมคินเสมอมา ขอให้ท่านและครอบครัวพบเจอแต่ความสุข สุขภาพแข็งแรง และรุ่งเรืองตลอดปี 2569 ครับ/ค่ะ🎉🧡\n\n";
    //                 $content .= "ขออภัยในความไม่สะดวก หากท่านทิ้งข้อความไว้ แอดมินจะรีบกลับมาตอบกลับโดยเร็วที่สุดในวันเปิดทำการครับ/ค่ะ\n\n";
    //                 $content = $content . "เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลท่านได้ถูกต้อง กรุณาเลือก เมนู ที่ท่านต้องการติดต่อ";
    //             } elseif ($now->isSunday() || $now->hour < 8 || $now->hour >= 17) {
    //                 $content = "พัมคินสวัสดีครับ/ค่ะ 🙏 เนื่องจากขณะนี้เป็นเวลานอกทำการ ต้องขออภัยที่ไม่สามารถให้บริการลูกค้าได้ทันที\n";
    //                 $content .= "โปรดฝากข้อความและเบอร์ติดต่อกลับ พัมคินจะเร่งติดต่อกลับท่านโดยเร็วที่สุด\n\n";
    //                 $content .= "บริษัทขออนุญาตแจ้งเวลาทําการคือวันจันทร์-เสาร์ เวลา 08:00-17:00น. หยุดทุกวันอาทิตย์และนักขัตฤกษ์\n";
    //                 $content .= "เจ้าหน้าที่จะเร่งดำเนินการตอบกลับโดยเร็วในเวลาทำการ ต้องขออภัยเป็นอย่างสูง ครับ/ค่ะ🧡";
    //             } else {
    //                 $content = "สวัสดีคุณ " . $customer['custName'];
    //                 $content = $content . " เพื่อให้การบริการของเราดำเนินไปอย่างรวดเร็วและสะดวกยิ่งขึ้น";
    //                 $content = $content . "กรุณาเลือกหัวข้อด้านล่าง เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลและบริการท่านได้อย่างถูกต้องและรวดเร็ว ขอบคุณครับ/ค่ะ";
    //             }

    //             return [
    //                 'status' => true,
    //                 'send_to_cust' => true,
    //                 'type_send' => 'menu',
    //                 'type_message' => 'reply',
    //                 'messages' => [
    //                     [
    //                         'content' => $content,
    //                         'contentType' => 'text'
    //                     ]
    //                 ],
    //                 'customer' => $customer,
    //                 'ac_id' => $new_ac['id'],
    //                 'platform_access_token' => $platformAccessToken,
    //                 'reply_token' => $message['reply_token'],
    //                 'bot' => $bot
    //             ];
    //         } else {
    //             return [
    //                 'status' => true,
    //                 'send_to_cust' => true,
    //                 'type_send' => 'sended',
    //                 'type_message' => 'reply',
    //                 'messages' => [
    //                     [
    //                         'content' => 'ระบบกำลังส่งต่อให้เจ้าหน้าที่ กรุณารอซักครู่',
    //                         'contentType' => 'text'
    //                     ]
    //                 ],
    //                 'customer' => $customer,
    //                 'ac_id' => $new_ac['id'],
    //                 'platform_access_token' => $platformAccessToken,
    //                 'reply_token' => $message['reply_token'],
    //                 'bot' => $bot
    //             ];
    //         }
    //         Log::channel('webhook_main')->info('สร้างเคสใหม่สำเร็จ');
    //     } catch (\Exception $e) {
    //         Log::channel('webhook_main')->error('เกิดข้อผิดพลาดในการสร้างเคสใหม่: ' . $e->getMessage());
    //         return ['status' => false, 'message' => 'เกิดข้อผิดพลาดในการสร้างเคสใหม่: ' . $e->getMessage()];
    //     }
    // }

    //กรองเคสสำหรับเคสที่คาดว่าเป็นสแปม 
    // public function case($message, $customer, $platformAccessToken, $bot)
    // {
    //     try {
    //         Log::channel('webhook_main')->info('ปัจจุบันเป็นเคสใหม่ ไม่เคยสร้างเคส');
    //         $now = Carbon::now();

    //         $prediction = null;
    //         try {
    //             if ($message['contentType'] === 'image' && isset($message['file_path'])) {
    //                 $response = Http::attach(
    //                     'file',
    //                     file_get_contents($message['file_path']),
    //                     basename($message['file_path'])
    //                 )->post(env("AI_API_BASE_URL") . "/predict");
    //             } else {
    //                 $response = Http::post(env("AI_API_BASE_URL") . "/predict_url", [
    //                     'url' => $message['content']
    //                 ]);
    //             }

    //             if ($response->successful()) {
    //                 $prediction = $response->json('prediction');
    //             }
    //         } catch (\Exception $e) {
    //             Log::channel('webhook_main')->error("Spam check API error: " . $e->getMessage());
    //         }

    //         if (in_array($prediction, ['GREETING', 'NSFW'])) {
    //             $roomId = 'ROOM12';   // ห้องสแปม
    //             $status = 'pending';
    //         } else {
    //             $keyword = $this->checkKeyword->check($message);
    //             if ($keyword['status']) {
    //                 $roomId = $keyword['redirectTo'];
    //                 $status = 'pending';
    //             } else {
    //                 $roomId = 'ROOM00'; // ห้องบอท
    //                 $status = 'progress';
    //             }
    //         }

    //         $new_rate = Rates::query()->create([
    //             'custId' => $customer['custId'],
    //             'latestRoomId' => $roomId,
    //             'status' => $status,
    //             'rate' => 0,
    //         ]);

    //         $new_ac = ActiveConversations::query()->create([
    //             'custId' => $customer['custId'],
    //             'roomId' => $roomId,
    //             'receiveAt' => $status === 'pending' ? null : $now,
    //             'startTime' => $status === 'pending' ? null : $now,
    //             'empCode' => $bot['empCode'],
    //             'rateRef' => $new_rate['id']
    //         ]);

    //         ChatHistory::query()->create([
    //             'custId' => $customer['custId'],
    //             'content' => $message['content'],
    //             'contentType' => $message['contentType'],
    //             'sender' => json_encode($customer),
    //             'conversationRef' => $new_ac['id'],
    //             'line_message_id' => $message['line_message_id'] ?? null,
    //             'line_quote_token' => $message['line_quote_token'] ?? null,
    //             'line_quoted_message_id' => $message['line_quoted_message_id'] ?? null,
    //         ]);

    //         $this->pusherService->sendNotification($customer['custId']);

    //         if ($roomId === 'ROOM00') {
    //             $content = "สวัสดีคุณ" . $customer['custName'];
    //             $content .= " เพื่อให้การบริการของเราดำเนินไปอย่างรวดเร็วและสะดวกยิ่งขึ้น";
    //             $content .= " กรุณาเลือกหัวข้อด้านล่าง เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลและบริการท่านได้อย่างถูกต้องและรวดเร็ว ขอบคุณค่ะ/ครับ";

    //             return [
    //                 'status' => true,
    //                 'send_to_cust' => true,
    //                 'type_send' => 'menu',
    //                 'type_message' => 'reply',
    //                 'messages' => [
    //                     [
    //                         'content' => $content,
    //                         'contentType' => 'text'
    //                     ]
    //                 ],
    //                 'customer' => $customer,
    //                 'ac_id' => $new_ac['id'],
    //                 'platform_access_token' => $platformAccessToken,
    //                 'reply_token' => $message['reply_token'],
    //                 'bot' => $bot
    //             ];
    //         } elseif ($roomId === 'ROOM12') {
    //             return [
    //                 'status' => true,
    //                 'send_to_cust' => false,
    //                 'type_send' => 'spam',
    //                 'type_message' => 'system',
    //                 'messages' => [],
    //                 'customer' => $customer,
    //                 'ac_id' => $new_ac['id'],
    //                 'platform_access_token' => $platformAccessToken,
    //                 'reply_token' => $message['reply_token'],
    //                 'bot' => $bot
    //             ];
    //         } else {
    //             return [
    //                 'status' => true,
    //                 'send_to_cust' => true,
    //                 'type_send' => 'sended',
    //                 'type_message' => 'reply',
    //                 'messages' => [
    //                     [
    //                         'content' => 'ระบบกำลังส่งต่อให้เจ้าหน้าที่ กรุณารอซักครู่',
    //                         'contentType' => 'text'
    //                     ]
    //                 ],
    //                 'customer' => $customer,
    //                 'ac_id' => $new_ac['id'],
    //                 'platform_access_token' => $platformAccessToken,
    //                 'reply_token' => $message['reply_token'],
    //                 'bot' => $bot
    //             ];
    //         }
    //     } catch (\Exception $e) {
    //         Log::channel('webhook_main')->error('เกิดข้อผิดพลาดในการสร้างเคสใหม่: ' . $e->getMessage());
    //         return ['status' => false, 'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()];
    //     }
    // }


    public function case($message, $customer, $platformAccessToken, $bot)
    {
        try {
            Log::channel('webhook_main')->info('ปัจจุบันเป็นเคสใหม่ ไม่เคยสร้างเคส');
            $now = Carbon::now();

            // ตรวจสอบงานสถาปนิก
            $architectType = $this->architectService->handleKeywordDetection($message);

            // เช็คข้อความลูกค้าว่าตรงตาม keyword หรือไม่ ถ้าตรงให้่ส่งไปยังห้องนั้นๆ
            $keyword = $this->checkKeyword->check($message);

            if ($architectType) {
                $roomId = $this->architectService->getRoomId();
                $status = 'pending';
            } elseif ($keyword['status']) {
                $roomId = $keyword['redirectTo'];
                $status = 'pending';
            } else {
                $roomId = 'ROOM00';
                $status = 'progress';
            }

            $new_rate = Rates::query()->create([
                'custId' => $customer['custId'],
                'latestRoomId' => $roomId,
                'status' => $status,
                'rate' => 0,
            ]);

            $new_ac = ActiveConversations::query()->create([
                'custId' => $customer['custId'],
                'roomId' => $new_rate['latestRoomId'],
                'receiveAt' => $new_rate['status'] === 'pending' ? null : $now,
                'startTime' => $new_rate['status'] === 'pending' ? null : $now,
                'empCode' => $bot['empCode'],
                'rateRef' => $new_rate['id']
            ]);
            $store_chat = ChatHistory::query()->create([
                'custId' => $customer['custId'],
                'content' => $message['content'],
                'contentType' => $message['contentType'],
                'sender' => json_encode($customer),
                'conversationRef' => $new_ac['id'],
                'line_message_id' => $message['line_quote_token'] ?? null,
                'line_quote_token' => $message['line_quote_token'] ?? null,
                'line_quoted_message_id' => $message['line_quoted_message_id'] ?? null,
            ]);
            $this->pusherService->sendNotification($customer['custId']);

            // ถ้าเป็นงานสถาปนิก ส่งการตอบกลับเฉพาะ
            if ($architectType) {
                return $this->architectService->getResponse(
                    $architectType,
                    $customer,
                    $new_ac['id'],
                    $platformAccessToken,
                    $message['reply_token'],
                    $bot,
                    $message['content']
                );
            }

            $now = Carbon::now();
            $startHoliday = Carbon::create($now->year, 12, 31, 0, 0, 0);
            $endHoliday   = Carbon::create($now->year + 1, 1, 1, 23, 59, 59);

            // เพิ่มตัวแปรสำหรับวันหยุดสงกรานต์ 11 - 15 เมษายน 2569
            $startSongkran = Carbon::create(2026, 4, 11, 0, 0, 0);
            $endSongkran   = Carbon::create(2026, 4, 15, 23, 59, 59);

            // เช็คว่า อยู่ห้องไหน ถ้าอยู่ห้องบอท ให้ ส่งเมนูไป ถ้าไม่ใช่ ให้ส่งข้อความ ระบบได้ส่งให้เจ้าหน้าที่กรุณารอสักครู่
            if ($new_rate['latestRoomId'] === 'ROOM00') {

                if ($now->between($startHoliday, $endHoliday)) {
                    $content = "เรียน ลูกค้าทุกท่าน บริษัท พัมคิน (PUMPKIN) ขอแจ้งวันหยุดทำการดังนี้ครับ/ค่ะ\n";
                    $content .= "❌ ปิดทำการ: วันที่ 31 ธ.ค. - 1 ม.ค.\n";
                    $content .= "✅ เปิดให้บริการตามปกติ: วันที่ 2 ม.ค. เป็นต้นไป\n\n";
                    $content .= "ขอบพระคุณลูกค้าทุกท่านที่ไว้วางใจในสินค้าพัมคินเสมอมา ขอให้ท่านและครอบครัวพบเจอแต่ความสุข สุขภาพแข็งแรง และรุ่งเรืองตลอดปี 2570 ครับ/ค่ะ🎉🧡\n\n";
                    $content .= "ขออภัยในความไม่สะดวก หากท่านทิ้งข้อความไว้ แอดมินจะรีบกลับมาตอบกลับโดยเร็วที่สุดในวันเปิดทำการครับ/ค่ะ\n\n";
                    $content = $content . "เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลท่านได้ถูกต้อง กรุณาเลือก เมนู ที่ท่านต้องการติดต่อ";
                }
                // เพิ่มเงื่อนไขตรวจสอบวันหยุดสงกรานต์
                elseif ($now->between($startSongkran, $endSongkran)) {
                    $content = "💦 สุขสันต์วันสงกรานต์ 💦\n\n";
                    $content .= "บริษัท พัมคิน (PUMPKIN) ขอแจ้งวันหยุดทำการช่วงเทศกาลสงกรานต์\n";
                    $content .= "ในวันที่ 11 - 15 เมษายน 2569 คุณลูกค้าต้องการติดต่อสอบถามด้านใดสามารถทิ้งข้อความไว้ได้เลยค่ะ แอดมินจะรีบตอบกลับทุกท่านอย่างเร็วที่สุดในวันเปิดทำการค่ะกลับมาเปิดทำการปกติในวันที่ 16 เมษายน 2569\n\n";
                    $content .= "ขอให้คุณลูกค้าทุกท่านมีความสุขและเดินทางปลอดภัยในวันสงกรานต์นี้นะคะ ขอบพระคุณค่ะ 🎃🧡\n\n";
                    $content .= "เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลท่านได้ถูกต้อง กรุณาเลือก เมนู ที่ท่านต้องการติดต่อ";
                } elseif ($now->isSunday() || $now->hour < 8 || $now->hour >= 17) {
                    $content = "พัมคินสวัสดีครับ/ค่ะ 🙏 เนื่องจากขณะนี้เป็นเวลานอกทำการ ต้องขออภัยที่ไม่สามารถให้บริการลูกค้าได้ทันที\n";
                    $content .= "โปรดฝากข้อความและเบอร์ติดต่อกลับ พัมคินจะเร่งติดต่อกลับท่านโดยเร็วที่สุด\n\n";
                    $content .= "บริษัทขออนุญาตแจ้งเวลาทําการคือวันจันทร์-เสาร์ เวลา 08:00-17:00น. หยุดทุกวันอาทิตย์และนักขัตฤกษ์\n";
                    $content .= "เจ้าหน้าที่จะเร่งดำเนินการตอบกลับโดยเร็วในเวลาทำการ ต้องขออภัยเป็นอย่างสูง ครับ/ค่ะ🧡";
                } else {
                    $content = "สวัสดีคุณ " . $customer['custName'];
                    $content = $content . " เพื่อให้การบริการของเราดำเนินไปอย่างรวดเร็วและสะดวกยิ่งขึ้น";
                    $content = $content . "กรุณาเลือกหัวข้อด้านล่าง เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลและบริการท่านได้อย่างถูกต้องและรวดเร็ว ขอบคุณครับ/ค่ะ";
                }

                return [
                    'status' => true,
                    'send_to_cust' => true,
                    'type_send' => 'menu',
                    'type_message' => 'reply',
                    'messages' => [
                        [
                            'content' => $content,
                            'contentType' => 'text'
                        ]
                    ],
                    'customer' => $customer,
                    'ac_id' => $new_ac['id'],
                    'platform_access_token' => $platformAccessToken,
                    'reply_token' => $message['reply_token'],
                    'bot' => $bot
                ];
            } else {
                return [
                    'status' => true,
                    'send_to_cust' => true,
                    'type_send' => 'sended',
                    'type_message' => 'reply',
                    'messages' => [
                        [
                            'content' => 'ระบบกำลังส่งต่อให้เจ้าหน้าที่ กรุณารอซักครู่',
                            'contentType' => 'text'
                        ]
                    ],
                    'customer' => $customer,
                    'ac_id' => $new_ac['id'],
                    'platform_access_token' => $platformAccessToken,
                    'reply_token' => $message['reply_token'],
                    'bot' => $bot
                ];
            }
            Log::channel('webhook_main')->info('สร้างเคสใหม่สำเร็จ');
        } catch (\Exception $e) {
            Log::channel('webhook_main')->error('เกิดข้อผิดพลาดในการสร้างเคสใหม่: ' . $e->getMessage());
            return ['status' => false, 'message' => 'เกิดข้อผิดพลาดในการสร้างเคสใหม่: ' . $e->getMessage()];
        }
    }

    public static function formatBotMenu($custName, $platForm, $platFrom_id)
    {
        $msg_bot = [];
        switch (strtoupper($platForm)) {
            case 'LINE':
                $msg_bot[0]['text'] = "สวัสดีคุณ " . $custName . " เพื่อให้การบริการของเราดำเนินไปอย่างรวดเร็วและสะดวกยิ่งขึ้น กรุณาเลือกหัวข้อด้านล่าง เพื่อให้เจ้าหน้าที่สามารถให้ข้อมูลและบริการท่านได้อย่างถูกต้องและรวดเร็ว ขอบคุณค่ะ/ครับ";
                $msg_bot[0]['type'] = 'text';
                $msg_bot[1]['type'] = 'template';
                $msg_bot[1]['altText'] = 'this is a buttons template';
                $msg_bot[1]['template']['type'] = 'buttons';
                $msg_bot[1]['template']['imageBackgroundColor'] = '#FFFFFF';
                $msg_bot[1]['template']['title'] = 'ยินดีต้อนรับ 🤖';
                $msg_bot[1]['template']['text'] = 'กรุณาเลือกเมนูที่ท่านต้องการสอบถาม';
                $menu_list = BotMenu::query()->where('botTokenId', $platFrom_id)->orderBy('id')->get();
                if (count($menu_list) > 0) {
                    foreach ($menu_list as $key => $menu) {
                        $msg_bot[1]['template']['actions'][$key] = [
                            'type' => 'message',
                            'label' => $menu['menuName'],
                            'text' => $menu['menuName'],
                        ];
                    }
                } else {
                    $msg_bot[1]['template']['actions'][0] = [
                        'type' => 'message',
                        'label' => 'สอบถาม / อื่นๆ',
                        'text' => 'สอบถาม / อื่นๆ'
                    ];
                }
                break;
            default:
                $msg_bot[0]['text'] = "เพิ่ม message ที่นี่";
                $msg_bot[0]['type'] = 'text';
        }
        return $msg_bot;
    }
}
