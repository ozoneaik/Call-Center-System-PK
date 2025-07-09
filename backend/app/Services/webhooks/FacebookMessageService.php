<?php

namespace App\Services\webhooks;

use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class FacebookMessageService
{
    public function sendMessage($fb_page_id, $access_token, $message, $sender_id)
    {
        $url = 'https://graph.facebook.com/v23.0/' . $fb_page_id . '/messages';
        $message_body = [];
        if ($message['contentType'] === 'text') {
            $message_body['text'] = $message['content'];
        }
        try {
            $req = Http::withHeaders([
                // 'Authorization' => 'Bearer ' . $access_token,
                'Content-Type' => 'application/json',
            ])->post($url, [
                'access_token' => $access_token,
                'messaging_type' => 'RESPONSE',
                'recipient' => [
                    'id' => $sender_id
                ],
                'message' => $message_body
            ]);
            if ($req->successful() && $req->status() === 200) {
                return [
                    'status' => true,
                    'message' => 'ส่งข้อความผ่าน api facebook สำเร็จ ✅ : ' . $req->body()
                ];
            } else throw new \Exception('ส่งข้อความผ่าน api facebook ไม่สำเร็จ ❌ : ' . $req->body());
        } catch (\Exception $e) {
            return [
                'status' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function getProfile($sender_id, $fields = 'first_name,last_name,profile_pic')
    {
        try {
            $customer_saved = Customers::query()
                ->leftJoin('platform_access_tokens', 'platform_access_tokens.id', '=', 'customers.platformRef')
                ->where('customers.custId', 'like', $sender_id)
                ->select('customers.*', 'platform_access_tokens.accessToken')
                ->first();

            $customer_saved = $customer_saved ? $customer_saved->toArray() : null;
            if ($customer_saved) {
                Log::channel('facebook_webhook_log')->info('เจอ');
                return [
                    'status' => true,
                    'message' => 'ดึงข้อมูลลูกค้าสำเร็จ',
                    'customer' => $customer_saved
                ];
            } else {
                Log::channel('facebook_webhook_log')->info('ไม่เจอ');
                $new_customer = [];
                $access_token_list = PlatformAccessTokens::query()->where('platform', 'facebook')->get();
                foreach ($access_token_list as $token) {
                    $access_token = $token['accessToken'];
                    $endpoint = $sender_id . "?access_token=" . $access_token . "&fields=" . $fields;
                    $url = "https://graph.facebook.com/v23.0/" . $endpoint;
                    $req = Http::get($url);
                    if ($req->successful() && $req->status() === 200) {
                        $res_json = $req->json();
                        $store_customer = Customers::query()->create([
                            'custId' => $res_json['id'],
                            'custName' => $res_json['first_name'] . " " . $res_json['last_name'],
                            'avatar' => $res_json['profile_pic'] ?? null,
                            'description' => 'ติดต่อมาจาก facebook ' . $token['description'],
                            'platformRef' => $token['id']
                        ]);
                        $new_customer = $store_customer->toArray();
                        $new_customer['accessToken'] = $token['accessToken'];
                        break;
                    }
                }
                if ($new_customer) {
                    return [
                        'status' => true,
                        'message' => 'สร้างข้อมูลลูกค้าสำเร็จ',
                        'customer' => $new_customer
                    ];
                } else {
                    throw new \Exception('สร้างหรือดึงข้อมูลลูกค้าไม่สำเร็จ');
                }
            }
        } catch (\Exception $e) {
            return [
                'status' => false,
                'message' => $e->getMessage(),
                'customer' => null
            ];
        }
    }
    public function storeMessage($sender_id, $ac_id, $message,$sender){
        Log::info('test');
        $store_chat = ChatHistory::query()->create([
            'custId' => $sender_id,
            'conversationRef' => $ac_id,
            'content' => $message['content'],
            'contentType' => $message['contentType'],
            'sender' => json_encode($sender),
        ]);
    }
}
