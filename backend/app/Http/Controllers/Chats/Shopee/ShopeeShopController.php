<?php

namespace App\Http\Controllers\Chats\Shopee;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShopeeShopController extends Controller
{

    public function helperGenerateSign($apiType)
    {
        $partnerId = (int) env('SHOPEE_PARTNER_ID');
        $partnerKey = env('SHOPEE_PARTNER_KEY');
        $timestamp = time();
        $accessToken = env('SHOPEE_ACCESS_TOKEN');
        $shopId = (int) env('SHOPEE_SHOP_ID');

        // 1. อัปเดต Array ของ Path ให้ถูกต้องและสอดคล้องกัน
        $apiPaths = [
            'shop_info' => '/api/v2/shop/get_shop_info',
            'product_list' => '/api/v2/product/get_item_list',
            'order_list' => '/api/v2/order/get_order_list',
            'conversation_list' => '/api/v2/sellerchat/get_conversation_list',
            'get_message' => '/api/v2/sellerchat/get_message', // แก้ไขจาก message_list เป็น get_message
            'send_message' => '/api/v2/sellerchat/send_message',
        ];

        if (!isset($apiPaths[$apiType])) {
            return response()->json(['error' => 'Invalid API type'], 400);
        }

        $path = $apiPaths[$apiType];

        if (in_array($apiType, ['shop_info', 'product_list', 'order_list', 'conversation_list', 'get_message', 'send_message'])) {
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
            'full_url_for_get_request' => "https://partner.shopeemobile.com{$path}?partner_id={$partnerId}&shop_id={$shopId}&timestamp={$timestamp}&sign={$sign}&access_token={$accessToken}"
        ]);
    }

    public function testTypeAPI($apiType)
    {
        $partnerId = (int) env('SHOPEE_PARTNER_ID');
        $partnerKey = env('SHOPEE_PARTNER_KEY');
        $timestamp = time();
        $accessToken = env('SHOPEE_ACCESS_TOKEN');
        $shopId = (int) env('SHOPEE_SHOP_ID'); 

        $apiPaths = [
            'shop_info' => '/api/v2/shop/get_shop_info',
            'product_list' => '/api/v2/product/get_item_list',
            'conversation_list' => '/api/v2/sellerchat/get_conversation_list',
            'order_list' => '/api/v2/order/get_order_list',
            'order_detail' => '/api/v2/order/get_order_detail',
            'get_message' => '/api/v2/sellerchat/get_message',
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
            $params['page_size'] = 20;
        } elseif ($apiType === 'order_list') {
            $params['time_range_field'] = 'create_time';
            $params['time_from'] = time() - (3 * 24 * 60 * 60);
            $params['time_to'] = time();
            $params['page_size'] = 20;
        }
        elseif ($apiType === 'get_message') {
            $params['conversation_id'] = request('conversation_id');
            $params['offset'] = request('offset', 0); 
            $params['page_size'] = request('page_size', 20); 
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
