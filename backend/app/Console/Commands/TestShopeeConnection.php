<?php

namespace App\Console\Commands;

use App\shopee\ShopeeChatService;
use Illuminate\Console\Command;

class TestShopeeConnection extends Command
{
    protected $signature = 'shopee:test-connection';
    protected $description = 'Test Shopee API connection and debug';

    public function handle()
    {
        $this->info('Testing Shopee API Connection...');
        
        // ตรวจสอบ configuration
        $this->info('Checking configuration...');
        $partnerId = config('shopee.partner_id');
        $partnerKey = config('shopee.partner_key');
        $shopId = config('shopee.shop_id');
        $accessToken = config('shopee.access_token');
        
        if (empty($partnerId)) {
            $this->error('SHOPEE_PARTNER_ID is not set in .env');
            return;
        }
        
        if (empty($partnerKey)) {
            $this->error('SHOPEE_PARTNER_KEY is not set in .env');
            return;
        }
        
        if (empty($shopId)) {
            $this->error('SHOPEE_SHOP_ID is not set in .env');
            return;
        }
        
        if (empty($accessToken)) {
            $this->error('SHOPEE_ACCESS_TOKEN is not set in .env');
            return;
        }
        
        $this->info("Partner ID: {$partnerId}");
        $this->info("Shop ID: {$shopId}");
        $this->info("Access Token: " . substr($accessToken, 0, 10) . '...');
        
        // ทดสอบการคำนวณ Sign
        $this->info('Testing Sign generation...');
        $path = '/api/v2/shop/get_shop_info';
        $timestamp = time();
        $baseString = $partnerId . $path . $timestamp . $accessToken . $shopId;
        $sign = hash_hmac('sha256', $baseString, $partnerKey);
        
        $this->info("Path: {$path}");
        $this->info("Timestamp: {$timestamp}");
        $this->info("Base String: {$baseString}");
        $this->info("Generated Sign: {$sign}");
        
        // ทดสอบการเรียก API
        $this->info('Testing API call...');
        $chatService = new ShopeeChatService();
        $result = $chatService->testConnection();
        
        if ($result['success']) {
            $this->info('✅ Connection successful!');
            $this->info('Shop Name: ' . ($result['shop_name'] ?? 'N/A'));
            $this->info('Shop ID: ' . ($result['shop_id'] ?? 'N/A'));
        } else {
            $this->error('❌ Connection failed!');
            $this->error('Error: ' . $result['message']);
        }
    }
}
