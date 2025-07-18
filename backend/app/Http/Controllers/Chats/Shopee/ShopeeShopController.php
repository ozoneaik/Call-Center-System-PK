<?php

namespace App\Http\Controllers\Chats\Shopee;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShopeeShopController extends Controller
{
    public function requestShopInfo()
    {
        $partnerId = (int) env('SHOPEE_PARTNER_ID');
        $partnerKey = env('SHOPEE_PARTNER_KEY');
        $path = '/api/v2/shop/get_shop_info';
        $timestamp = time();
        $accessToken = env('SHOPEE_ACCESS_TOKEN');
        $shopId = env('SHOPEE_SHOP_ID');

        $stringToBeSigned = $partnerId . $path . $timestamp . $accessToken . $shopId;
        $sign = hash_hmac('sha256', $stringToBeSigned, $partnerKey);

        return response()->json([
            'partner_id' => $partnerId,
            'shop_id' => $shopId,
            'timestamp' => $timestamp,
            'path' => $path,
            'string_to_sign' => $stringToBeSigned,
            'sign' => $sign,
            'access_token' => $accessToken
        ]);
    }

    public function getShopInfo()
    {
        $partnerId = (int) env('SHOPEE_PARTNER_ID');
        $partnerKey = env('SHOPEE_PARTNER_KEY');
        $accessToken = env('SHOPEE_ACCESS_TOKEN');
        $shopId = (int) env('SHOPEE_SHOP_ID');

        $path = '/api/v2/shop/get_shop_info';
        $timestamp = time();

        $stringToSign = $partnerId . $path . $timestamp . $accessToken . $shopId;
        $sign = hash_hmac('sha256', $stringToSign, $partnerKey);

        $url = 'https://partner.shopeemobile.com' . $path;

        $response = Http::get($url, [
            'partner_id'    => $partnerId,
            'shop_id'       => $shopId,
            'timestamp'     => $timestamp,
            'sign'          => $sign,
            'access_token'  => $accessToken,
        ]);

        if ($response->successful()) {
            return response()->json($response->json());
        } else {
            Log::error('Shopee API error', ['response' => $response->body()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch shop info.',
                'error' => $response->json()
            ], $response->status());
        }
    }

    public function getSignConversation()
    {
        $partnerId = (int) env('SHOPEE_PARTNER_ID');
        $partnerKey = env('SHOPEE_PARTNER_KEY');
        $timestamp = time();
        $accessToken = env('SHOPEE_ACCESS_TOKEN');
        $shopId = env('SHOPEE_SHOP_ID');
        $path = '/api/v2/sellerchat/get_conversation_list';

        $stringToBeSigned = $partnerId . $path . $timestamp . $accessToken . $shopId;
        $sign = hash_hmac('sha256', $stringToBeSigned, $partnerKey);

        $url = "https://partner.shopeemobile.com{$path}";

        $params = [
            'partner_id' => $partnerId,
            'shop_id' => $shopId,
            'timestamp' => $timestamp,
            'sign' => $sign,
            'access_token' => $accessToken,
            'direction' => 'next',
            'page_size' => 20
        ];

        $next = request()->query('next_timestamp_nano');
        if (!empty($next) && (int)$next > 0) {
            $params['next_timestamp_nano'] = $next;
        }
        try {
            $response = Http::get($url, $params);
            $data = $response->json();

            return response()->json([
                'success' => true,
                'conversations' => $data['response']['conversations'] ?? [],
                'next_timestamp_nano' => $data['response']['next_timestamp_nano'] ?? null,
                'more' => $data['response']['more'] ?? false,
                'full_response' => $data,
                'request_info' => [
                    'url' => $url,
                    'params' => $params,
                    'status' => $response->status()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'API call failed',
                'message' => $e->getMessage(),
                'request_info' => [
                    'url' => $url,
                    'params' => $params
                ]
            ], 500);
        }
    }

    public function getAllConversations()
    {
        $allConversations = [];
        $partnerId = (int) env('SHOPEE_PARTNER_ID');
        $partnerKey = env('SHOPEE_PARTNER_KEY');
        $accessToken = env('SHOPEE_ACCESS_TOKEN');
        $shopId = (int) env('SHOPEE_SHOP_ID');
        $path = '/api/v2/sellerchat/get_conversation_list';

        $nextTimestampNano = 0;
        $more = true;

        try {
            while ($more) {
                $timestamp = time();
                $stringToBeSigned = $partnerId . $path . $timestamp . $accessToken . $shopId;
                $sign = hash_hmac('sha256', $stringToBeSigned, $partnerKey);

                $url = "https://partner.shopeemobile.com{$path}";
                $params = [
                    'partner_id' => $partnerId,
                    'shop_id' => $shopId,
                    'timestamp' => $timestamp,
                    'sign' => $sign,
                    'access_token' => $accessToken,
                    'direction' => 'next',
                    'page_size' => 20,
                    'next_timestamp_nano' => $nextTimestampNano,
                ];

                $response = Http::get($url, $params);
                $data = $response->json();

                if ($response->successful() && isset($data['response']['conversations'])) {
                    $allConversations = array_merge($allConversations, $data['response']['conversations']);

                    $more = $data['response']['more'];
                    $nextTimestampNano = $data['response']['next_timestamp_nano'];
                } else {
                    $more = false;
                }
            }

            return response()->json([
                'total_conversations' => count($allConversations),
                'conversations' => $allConversations,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    //Helper Function สำหรับสร้าง Signature ทั่วไป 
    public function helperGenerateSign($apiType)
    {
        $partnerId = (int) env('SHOPEE_PARTNER_ID');
        $partnerKey = env('SHOPEE_PARTNER_KEY');
        $timestamp = time();
        $accessToken = env('SHOPEE_ACCESS_TOKEN');;
        $shopId = env('SHOPEE_SHOP_ID');

        $apiPaths = [
            'shop_info' => '/api/v2/shop/get_shop_info',
            'product_list' => '/api/v2/product/get_item_list',
            'order_list' => '/api/v2/order/get_order_list',
            'conversation_list' => '/api/v2/sellerchat/get_conversation_list',
            'message_list' => '/api/v2/sellerchat/get_message_list',
            'send_message' => '/api/v2/sellerchat/send_message',
        ];

        if (!isset($apiPaths[$apiType])) {
            return response()->json(['error' => 'Invalid API type'], 400);
        }

        $path = $apiPaths[$apiType];

        if (in_array($apiType, ['shop_info', 'product_list', 'order_list', 'conversation_list', 'message_list', 'send_message'])) {
            $stringToBeSigned = $partnerId . $path . $timestamp . $accessToken . $shopId;
        } else {
            $stringToBeSigned = $partnerId . $path . $timestamp;
        }

        $sign = hash_hmac('sha256', $stringToBeSigned, $partnerKey);

        return response()->json([
            'api_type' => $apiType,
            'partner_id' => $partnerId,
            'shop_id' => $shopId,
            'timestamp' => $timestamp,
            'path' => $path,
            'string_to_sign' => $stringToBeSigned,
            'sign' => $sign,
            'access_token' => $accessToken,
            'full_url' => "https://partner.shopeemobile.com{$path}?partner_id={$partnerId}&shop_id={$shopId}&timestamp={$timestamp}&sign={$sign}&access_token={$accessToken}"
        ]);
    }

    public function testTypeAPI($apiType)
    {
        $partnerId = (int) env('SHOPEE_PARTNER_ID');
        $partnerKey = env('SHOPEE_PARTNER_KEY');
        $timestamp = time();
        $accessToken = env('SHOPEE_ACCESS_TOKEN');
        $shopId = env('SHOPEE_SHOP_ID');

        $apiPaths = [
            'shop_info' => '/api/v2/shop/get_shop_info',
            'product_list' => '/api/v2/product/get_item_list',
            'conversation_list' => '/api/v2/sellerchat/get_conversation_list',
            'message_list' => '/api/v2/sellerchat/get_message_list',
            'send_message' => '/api/v2/sellerchat/send_message',
            'order_list' => '/api/v2/order/get_order_list',
            'order_detail' => '/api/v2/order/get_order_detail',
        ];

        if (!isset($apiPaths[$apiType])) {
            return response()->json(['error' => 'Invalid API type'], 400);
        }

        $path = $apiPaths[$apiType];
        $stringToBeSigned = $partnerId . $path . $timestamp . $accessToken . $shopId;
        $sign = hash_hmac('sha256', $stringToBeSigned, $partnerKey);

        $url = "https://partner.shopeemobile.com{$path}";
        $params = [
            'partner_id' => $partnerId,
            'shop_id' => $shopId,
            'timestamp' => $timestamp,
            'sign' => $sign,
            'access_token' => $accessToken
        ];

        if ($apiType === 'product_list') {
            $params['offset'] = 0;
            $params['page_size'] = 10;
        } elseif ($apiType === 'conversation_list') {
            $params['direction'] = 'next';
            $params['next_timestamp_nano'] = 0;
            $params['page_size'] = 20;
        } elseif ($apiType === 'message_list') {
            $params['conversation_id'] = request('conversation_id', 'example_conversation_id');
            $params['direction'] = 'next';
            $params['next_timestamp_nano'] = 0;
            $params['page_size'] = 20;
        } elseif ($apiType === 'order_list') {
            $params['time_range_field'] = 'create_time';
            $params['time_from'] = time() - (3 * 24 * 60 * 60);
            $params['time_to'] = time();
            $params['page_size'] = 20;
            $params['cursor'] = '';
        }
        try {
            $response = Http::get($url, $params);

            return response()->json([
                'api_type' => $apiType,
                'url' => $url,
                'params' => $params,
                'response' => $response->json(),
                'status' => $response->status()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'API call failed',
                'message' => $e->getMessage(),
                'url' => $url,
                'params' => $params
            ], 500);
        }
    }
}
