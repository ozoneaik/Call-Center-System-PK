<?php

namespace App\Http\Controllers;

use App\Models\PlatformAccessTokens;
use App\Services\Facebook\NewFacebookService;
use App\Services\PusherService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NewMessageFacebookController extends controller
{

    // protected NewFacebookService $facebookService;
    protected PusherService $pusherService;
    protected NewFacebookService $newFacebookService;

    public function __construct(PusherService $pusherService, NewFacebookService $newFacebookService)
    {
        // $this->facebookService = $facebookService;
        $this->pusherService = $pusherService;
        $this->newFacebookService = $newFacebookService;
    }

    // เป็น ฟังก์ชันสำหรับ "ยืนยัน webhook" จาก Facebook เท่านั้น
    public function webhook(Request $request)
    {
        Log::info('>>> Facebook GET webhook verify called');
        // ดึง token แรกจากฐานข้อมูล
        $firstToken = PlatformAccessTokens::where('platform', 'facebook')->first();
        // เช็คก่อนว่ามีข้อมูล token และ Facebook ส่งค่ามา
        if ($firstToken && $request->has(['hub_mode', 'hub_verify_token', 'hub_challenge'])) {
            $verify_token = $firstToken->fb_verify_token;
            $mode = $request->query('hub_mode');
            $token = $request->query('hub_verify_token');
            $challenge = $request->query('hub_challenge');
            // ตรวจสอบว่า token ตรงกัน
            if ($mode === 'subscribe' && $token === $verify_token) {
                Log::info('✅ Webhook verified successfully.');
                return response($challenge, 200);
            } else {
                Log::warning('❌ Token mismatch: expected ' . $verify_token . ' but got ' . $token);
            }
        } else {
            Log::error('❌ Missing token from DB or required parameters from Facebook.');
        }
        return response('Forbidden', 403);
    }
    // -------------------------------------------------------

    public function newWebhookFacebook(Request $request)
    {

        $data = $request->all();
        $messaging = $data['entry'][0]['messaging'][0] ?? null;

        if (!$messaging) {
            Log::error("❌ [Webhook] ไม่พบ key 'messaging' ใน payload");
            return response('Bad Request', 400);
        }

        $senderId = $messaging['sender']['id'] ?? null;
        $recipientId = $messaging['recipient']['id'] ?? null;
        $accessToken = PlatformAccessTokens::where('platform', 'facebook')->first()?->accessToken;
        $messageText = $messaging['message']['text'] ?? null;
        $textId = $messaging['message']['mid'] ?? null;
        $attachments = $messaging['message']['attachments'] ?? [];

        // 👉 Handle ข้อความปกติ
        if ($messaging) {
            $formatMessage = $this->newFacebookService->formatMessage($messaging);
            // return;
            Log::info("📨 ข้อความจากผู้ใช้ [$senderId]: \"$messageText\"");
            $profile = $this->newFacebookService->newGetSenderProfile($senderId, $accessToken, $recipientId);
            $formatProfile = $this->newFacebookService->formatProfile($profile);

            if ($profile) {
                $this->newFacebookService->newStoreCustomer($profile, $recipientId);
                Log::info("✅ บันทึกข้อมูลลูกค้าเรียบร้อย: {$profile['name']} ({$profile['id']})");
            }

            return response('EVENT_RECEIVED', 200);
        }

        // 👉 Handle สื่อแนบ (ถ้ามี)
        if (!empty($attachments)) {
            Log::info("🖼️ ผู้ใช้ [$senderId] ส่งสื่อแนบ " . count($attachments) . " รายการ");
            // คุณสามารถเพิ่ม logic สำหรับจัดการ attachment ตรงนี้ได้
        }

        return response('EVENT_RECEIVED', 200);
    }

    public function getFeedFacebook(Request $request)
    {
        $tokenList = PlatformAccessTokens::where('platform', 'facebook')->get();

        $page_list = [];
        foreach ($tokenList as $key => $token) {
            $page_list[$key]['page_id'] = $token->fb_page_id;
            $page_list[$key]['list'] = $this->newFacebookService->feedFacebook($token->fb_page_id, $token->accessToken);
        }

        return response()->json([
            'message' => 'Feed fetched successfully',
            'page_list' => $page_list
        ]);
    }

    public function postFeedFacebook(Request $request)
    {
        Log::info("📥 POST ใหม่:");
        Log::info("ข้อความโพสต์: " . $request->input('message'));
        Log::info("วันที่โพสต์: " . $request->input('publishDate'));
        Log::info("เพจที่เลือก: " . json_encode($request->input('page_ids'), JSON_UNESCAPED_UNICODE));
        Log::info("จำนวนภาพที่แนบ: " . count($request->file('images', [])));

        // Loop รูปภาพเพื่อ log ชื่อไฟล์
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $image) {
                Log::info("📷 ไฟล์ภาพที่แนบ [$index]: " . $image->getClientOriginalName());
            }
        }

        return;
        $this->newFacebookService->$this->newFacebookService->newFeedFacebook($pageId, $accessToken, $message, $caption, $imageInput);

        return response()->json([
            'message' => 'โพสต์ Facebook สำเร็จ',
        ]);
    }
}
