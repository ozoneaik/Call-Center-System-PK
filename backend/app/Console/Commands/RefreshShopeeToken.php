<?php

namespace App\Console\Commands;

use App\Models\ShopeeToken;
use App\ShopeeTokenService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RefreshShopeeToken extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'shopee:refresh-token';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Refresh the Shopee API access token using the stored refresh token.';

    /**
     * The ShopeeTokenService instance.
     *
     * @var \App\ShopeeTokenService
     */
    protected $tokenService;

    /**
     * Create a new command instance.
     *
     * @param  \App\ShopeeTokenService  $tokenService
     * @return void
     */
    public function __construct(ShopeeTokenService $tokenService)
    {
        parent::__construct();
        $this->tokenService = $tokenService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting Shopee token refresh process...');
        $token = ShopeeToken::first();

        if (!$token) {
            $this->error('No Shopee token found in the database. Please add one first.');
            Log::channel('shopee_refresh_cron_job_log')->error('Shopee Refresh Token Command: No token found in database.');
            return 1; 
        }

        $shopId = $token->shop_id;
        $refreshToken = $token->refresh_token;

        if (!$refreshToken) {
            $this->error("No refresh token found for Shop ID: {$shopId}.");
            Log::channel('shopee_refresh_cron_job_log')->error("Shopee Refresh Token Command: Missing refresh token for Shop ID {$shopId}.");
            return 1;
        }

        $this->info("Attempting to refresh token for Shop ID: {$shopId}.");

        try {
            $response = $this->tokenService->getAccessToken($shopId, $refreshToken);
            if (isset($response['shopee_response']['error']) && $response['shopee_response']['error']) {
                $errorMessage = $response['shopee_response']['message'] ?? 'Unknown error from Shopee API.';
                $this->error("Failed to refresh token. Shopee API Error: " . $errorMessage);
                Log::channel('shopee_refresh_cron_job_log')->error('Shopee Refresh Token Failed: ' . json_encode($response['shopee_response']));
                return 1;
            }
            if (isset($response['shopee_response']['access_token'])) {
                $shopeeData = $response['shopee_response'];
                $newAccessToken = $shopeeData['access_token'];
                $newRefreshToken = $shopeeData['refresh_token'];
                $expiresIn = $shopeeData['expire_in'];

                $this->info('Successfully refreshed Shopee access token.');
                $this->line("  - Shop ID: <fg=yellow>{$shopId}</>");
                $this->line("  - New Access Token: <fg=yellow>" . substr($newAccessToken, 0, 10) . "...</>");
                $this->line("  - New Refresh Token: <fg=yellow>" . substr($newRefreshToken, 0, 10) . "...</>");
                $this->line("  - Expires In: <fg=yellow>{$expiresIn} seconds</>");

                $logMessage = "Token refreshed for Shop ID {$shopId}. Details: " . json_encode($shopeeData);
                Log::channel('shopee_refresh_cron_job_log')->info($logMessage);

                return 0; 
            } else {
                $this->error('Failed to refresh token. The response did not contain an access_token.');
                Log::channel('shopee_refresh_cron_job_log')->error('Shopee Refresh Token Failed: No access_token in response. Full response: ' . json_encode($response));
                return 1;
            }
        } catch (\Exception $e) {
            $this->error('An exception occurred: ' . $e->getMessage());
            Log::channel('shopee_refresh_cron_job_log')->error('Shopee Refresh Token Exception: ' . $e->getMessage());
            return 1;
        }
    }
}
