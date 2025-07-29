<?php

namespace App\Http\Controllers\Chats\Tiktok;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class TikTokShopController extends Controller
{
    private $appKey;
    private $appSecret;
    private $accessToken;
    private $shopCipher;
    private $apiBaseUrl;

    public function __construct()
    {
        $this->appKey = config('services.tiktok.app_key');
        $this->appSecret = config('services.tiktok.app_secret');
        $this->accessToken = config('services.tiktok.access_token');
        $this->shopCipher = config('services.tiktok.shop_cipher');
        $this->apiBaseUrl = config('services.tiktok.api_base_url', 'https://open-api.tiktokglobalshop.com');
    }

    /**
     * Generate a signature for TikTok Shop API requests.
     * @param string $path - The API endpoint path (e.g., /order/202309/orders).
     * @param array $queryParams - The query parameters.
     * @param string|null $body - The JSON-encoded request body.
     * @return string The generated HMAC-SHA256 signature.
     */
    private function generateSign(string $path, array $queryParams, ?string $body = null): string
    {
        $filteredParams = array_filter($queryParams, function ($key) {
            return $key !== 'sign' && $key !== 'access_token';
        }, ARRAY_FILTER_USE_KEY);

        ksort($filteredParams);

        $paramString = '';
        foreach ($filteredParams as $key => $value) {
            $paramString .= $key . (is_array($value) ? json_encode($value, JSON_UNESCAPED_SLASHES) : $value);
        }

        $baseString = $path . $paramString;

        if ($body) {
            $baseString .= $body;
        }

        $stringToSign = $this->appSecret . $baseString . $this->appSecret;
        return hash_hmac('sha256', $stringToSign, $this->appSecret);
    }

    /**
     * Get the list of shops authorized by the developer's app.
     */
    public function getAuthorizedShops()
    {
        $path = '/authorization/202309/shops';
        try {
            $queryParams = [
                'app_key' => $this->appKey,
                'timestamp' => time(),
            ];
            $queryParams['sign'] = $this->generateSign($path, $queryParams, null);
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'x-tts-access-token' => $this->accessToken,
            ])
                ->withOptions(['query' => $queryParams])
                ->get($this->apiBaseUrl . $path);

            $json = $response->json();

            Log::channel('tiktok_token_log')->info('TikTok Authorized Response', [
                'response' => json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            ]);

            if ($response->successful() && isset($json['code']) && $json['code'] === 0) {
                return response()->json(['message' => 'ดึงข้อมูลร้านค้าสำเร็จ!', 'data' => $json['data']]);
            } else {
                return response()->json(['error' => 'ไม่สามารถดึงข้อมูลร้านค้าได้', 'details' => $json['message'] ?? 'Unknown error'], $response->status());
            }
        } catch (\Exception $e) {
            return response()->json(['error' => 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ TikTok API', 'exception' => $e->getMessage()], 500);
        }
    }

    /**
     * Example Request URL from your frontend/Postman:
     * /api/tiktok/order-detail?order_ids=579698391586931722
     */
    public function getOrderDetail(Request $request)
    {
        try {
            $validated = $request->validate([
                'order_ids' => 'required|string|min:1',
            ]);
            $orderIds = $validated['order_ids'];
        } catch (ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'messages' => $e->errors()], 422);
        }

        $path = '/order/202309/orders';

        try {
            $queryParams = [
                'app_key' => $this->appKey,
                'timestamp' => time(),
                'shop_cipher' => $this->shopCipher,
                'ids' => $orderIds,
            ];

            $queryParams['sign'] = $this->generateSign($path, $queryParams, null);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'x-tts-access-token' => $this->accessToken,
            ])
                ->withOptions(['query' => $queryParams])
                ->get($this->apiBaseUrl . $path);

            $json = $response->json();

            Log::channel('tiktok_token_log')->info('📦 TikTok Order Detail Response', [
                'request_url' => $this->apiBaseUrl . $path,
                'query_params' => $queryParams,
                'response' => json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            ]);

            if ($response->successful() && isset($json['code']) && $json['code'] === 0) {
                return response()->json([
                    'message' => 'ดึงข้อมูลออเดอร์สำเร็จ!',
                    'data' => $json['data']
                ]);
            } else {
                Log::channel('tiktok_token_log')->error('❌ TikTok Get Order Detail Failed', [
                    'response' => json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
                ]);
                return response()->json([
                    'error' => 'ไม่สามารถดึงข้อมูลออเดอร์ได้',
                    'details' => $json['message'] ?? 'Unknown error'
                ], $response->status());
            }
        } catch (\Exception $e) {
            Log::channel('tiktok_token_log')->error('🔥 TikTok API Exception: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ TikTok API',
                'exception' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get conversations list from TikTok Shop Customer Service API
     * Example Request URL: /api/tiktok/conversations?page_size=20&status=open
     */
    public function getConversations(Request $request)
    {
        try {
            $validated = $request->validate([
                'page_size' => 'nullable|integer|min:1|max:100',
                'page_token' => 'nullable|string',
                'status' => 'nullable|string|in:open,closed,resolved,all',
                'conversation_type' => 'nullable|string|in:buyer_seller,system',
                'start_time' => 'nullable|integer',
                'end_time' => 'nullable|integer',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'messages' => $e->errors()], 422);
        }

        $path = '/api/v1/customer_service/conversations';

        try {
            $queryParams = [
                'app_key' => $this->appKey,
                'timestamp' => time(),
                'version' => '202309',
                'shop_cipher' => $this->shopCipher,
                'page_size' => $validated['page_size'] ?? 20,
            ];

            // เพิ่มพารามิเตอร์เสริม
            if (!empty($validated['page_token'])) {
                $queryParams['page_token'] = $validated['page_token'];
            }
            if (!empty($validated['status'])) {
                $queryParams['status'] = $validated['status'];
            }
            if (!empty($validated['conversation_type'])) {
                $queryParams['conversation_type'] = $validated['conversation_type'];
            }
            if (!empty($validated['start_time'])) {
                $queryParams['start_time'] = $validated['start_time'];
            }
            if (!empty($validated['end_time'])) {
                $queryParams['end_time'] = $validated['end_time'];
            }

            $queryParams['sign'] = $this->generateSign($path, $queryParams, null);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'x-tts-access-token' => $this->accessToken,
            ])
                ->withOptions(['query' => $queryParams])
                ->get($this->apiBaseUrl . $path);

            $json = $response->json();

            Log::channel('tiktok_token_log')->info('💬 TikTok Conversations Response', [
                'request_url' => $this->apiBaseUrl . $path,
                'query_params' => $queryParams,
                'response' => json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            ]);

            if ($response->successful() && isset($json['code']) && $json['code'] === 0) {
                return response()->json([
                    'message' => 'ดึงข้อมูลการสนทนาสำเร็จ!',
                    'data' => $json['data'],
                    'pagination' => [
                        'has_more' => $json['data']['has_more'] ?? false,
                        'next_page_token' => $json['data']['next_page_token'] ?? null,
                        'total' => $json['data']['total'] ?? 0
                    ]
                ]);
            } else {
                Log::channel('tiktok_token_log')->error('❌ TikTok Get Conversations Failed', [
                    'response' => json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
                ]);
                return response()->json([
                    'error' => 'ไม่สามารถดึงข้อมูลการสนทนาได้',
                    'details' => $json['message'] ?? 'Unknown error'
                ], $response->status());
            }
        } catch (\Exception $e) {
            Log::channel('tiktok_token_log')->error('🔥 TikTok Conversations API Exception: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ TikTok API',
                'exception' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get conversation detail by conversation ID
     * Example Request URL: /api/tiktok/conversation/{conversation_id}
     */
    public function getConversationDetail(Request $request, $conversationId)
    {
        if (empty($conversationId)) {
            return response()->json(['error' => 'Conversation ID is required'], 400);
        }

        $path = "/api/v1/customer_service/conversations/{$conversationId}";

        try {
            $queryParams = [
                'app_key' => $this->appKey,
                'timestamp' => time(),
                'version' => '202309',
                'shop_cipher' => $this->shopCipher,
            ];

            $queryParams['sign'] = $this->generateSign($path, $queryParams, null);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'x-tts-access-token' => $this->accessToken,
            ])
                ->withOptions(['query' => $queryParams])
                ->get($this->apiBaseUrl . $path);

            $json = $response->json();

            Log::channel('tiktok_token_log')->info('💬 TikTok Conversation Detail Response', [
                'conversation_id' => $conversationId,
                'request_url' => $this->apiBaseUrl . $path,
                'response' => json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            ]);

            if ($response->successful() && isset($json['code']) && $json['code'] === 0) {
                return response()->json([
                    'message' => 'ดึงข้อมูลการสนทนาสำเร็จ!',
                    'data' => $json['data']
                ]);
            } else {
                return response()->json([
                    'error' => 'ไม่สามารถดึงข้อมูลการสนทนาได้',
                    'details' => $json['message'] ?? 'Unknown error'
                ], $response->status());
            }
        } catch (\Exception $e) {
            Log::channel('tiktok_token_log')->error('🔥 TikTok Conversation Detail API Exception: ' . $e->getMessage());
            return response()->json([
                'error' => 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ TikTok API',
                'exception' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get messages in a conversation
     * Example Request URL: /api/tiktok/conversation/{conversation_id}/messages?page_size=50
     */
    public function getConversationMessages(Request $request, $conversationId)
    {
        if (empty($conversationId)) {
            return response()->json(['error' => 'Conversation ID is required'], 400);
        }

        try {
            $validated = $request->validate([
                'page_size' => 'nullable|integer|min:1|max:100',
                'page_token' => 'nullable|string',
                'message_type' => 'nullable|string|in:text,image,file,system',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'messages' => $e->errors()], 422);
        }

        $path = "/api/v1/customer_service/conversations/{$conversationId}/messages";

        try {
            $queryParams = [
                'app_key' => $this->appKey,
                'timestamp' => time(),
                'version' => '202309',
                'shop_cipher' => $this->shopCipher,
                'page_size' => $validated['page_size'] ?? 50,
            ];

            if (!empty($validated['page_token'])) {
                $queryParams['page_token'] = $validated['page_token'];
            }
            if (!empty($validated['message_type'])) {
                $queryParams['message_type'] = $validated['message_type'];
            }

            $queryParams['sign'] = $this->generateSign($path, $queryParams, null);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'x-tts-access-token' => $this->accessToken,
            ])
                ->withOptions(['query' => $queryParams])
                ->get($this->apiBaseUrl . $path);

            $json = $response->json();

            Log::channel('tiktok_token_log')->info('💬 TikTok Conversation Messages Response', [
                'conversation_id' => $conversationId,
                'request_url' => $this->apiBaseUrl . $path,
                'response' => json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            ]);

            if ($response->successful() && isset($json['code']) && $json['code'] === 0) {
                return response()->json([
                    'message' => 'ดึงข้อความสำเร็จ!',
                    'data' => $json['data'],
                    'pagination' => [
                        'has_more' => $json['data']['has_more'] ?? false,
                        'next_page_token' => $json['data']['next_page_token'] ?? null
                    ]
                ]);
            } else {
                return response()->json([
                    'error' => 'ไม่สามารถดึงข้อความได้',
                    'details' => $json['message'] ?? 'Unknown error'
                ], $response->status());
            }
        } catch (\Exception $e) {
            Log::channel('tiktok_token_log')->error('🔥 TikTok Messages API Exception: ' . $e->getMessage());
            return response()->json([
                'error' => 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ TikTok API',
                'exception' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send a message to a conversation
     * Example Request: POST /api/tiktok/conversation/{conversation_id}/send
     * Body: {"message_type": "text", "content": {"text": "สวัสดีครับ"}}
     */
    public function sendMessage(Request $request, $conversationId)
    {
        if (empty($conversationId)) {
            return response()->json(['error' => 'Conversation ID is required'], 400);
        }

        try {
            $validated = $request->validate([
                'message_type' => 'required|string|in:text,image,file',
                'content' => 'required|array',
                'content.text' => 'required_if:message_type,text|string|max:4000',
                'content.image_url' => 'required_if:message_type,image|string|url',
                'content.file_url' => 'required_if:message_type,file|string|url',
                'content.file_name' => 'required_if:message_type,file|string',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'messages' => $e->errors()], 422);
        }

        $path = "/api/v1/customer_service/conversations/{$conversationId}/messages";

        try {
            $queryParams = [
                'app_key' => $this->appKey,
                'timestamp' => time(),
                'version' => '202309',
                'shop_cipher' => $this->shopCipher,
            ];

            $body = json_encode([
                'message_type' => $validated['message_type'],
                'content' => $validated['content']
            ], JSON_UNESCAPED_UNICODE);

            $queryParams['sign'] = $this->generateSign($path, $queryParams, $body);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'x-tts-access-token' => $this->accessToken,
            ])
                ->withOptions(['query' => $queryParams])
                ->withBody($body)
                ->post($this->apiBaseUrl . $path);

            $json = $response->json();

            Log::channel('tiktok_token_log')->info('💬 TikTok Send Message Response', [
                'conversation_id' => $conversationId,
                'message_content' => $validated,
                'request_url' => $this->apiBaseUrl . $path,
                'response' => json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            ]);

            if ($response->successful() && isset($json['code']) && $json['code'] === 0) {
                return response()->json([
                    'message' => 'ส่งข้อความสำเร็จ!',
                    'data' => $json['data']
                ]);
            } else {
                return response()->json([
                    'error' => 'ไม่สามารถส่งข้อความได้',
                    'details' => $json['message'] ?? 'Unknown error'
                ], $response->status());
            }
        } catch (\Exception $e) {
            Log::channel('tiktok_token_log')->error('🔥 TikTok Send Message API Exception: ' . $e->getMessage());
            return response()->json([
                'error' => 'เกิดข้อผิดพลาดในการส่งข้อความ',
                'exception' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update conversation status
     * Example Request: PUT /api/tiktok/conversation/{conversation_id}/status
     * Body: {"status": "resolved"}
     */
    public function updateConversationStatus(Request $request, $conversationId)
    {
        if (empty($conversationId)) {
            return response()->json(['error' => 'Conversation ID is required'], 400);
        }

        try {
            $validated = $request->validate([
                'status' => 'required|string|in:open,resolved,closed',
            ]);
        } catch (ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'messages' => $e->errors()], 422);
        }

        $path = "/api/v1/customer_service/conversations/{$conversationId}/status";

        try {
            $queryParams = [
                'app_key' => $this->appKey,
                'timestamp' => time(),
                'version' => '202309',
                'shop_cipher' => $this->shopCipher,
            ];

            $body = json_encode([
                'status' => $validated['status']
            ], JSON_UNESCAPED_UNICODE);

            $queryParams['sign'] = $this->generateSign($path, $queryParams, $body);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'x-tts-access-token' => $this->accessToken,
            ])
                ->withOptions(['query' => $queryParams])
                ->withBody($body)
                ->put($this->apiBaseUrl . $path);

            $json = $response->json();

            Log::channel('tiktok_token_log')->info('💬 TikTok Update Status Response', [
                'conversation_id' => $conversationId,
                'new_status' => $validated['status'],
                'response' => json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            ]);

            if ($response->successful() && isset($json['code']) && $json['code'] === 0) {
                return response()->json([
                    'message' => 'อัพเดทสถานะการสนทนาสำเร็จ!',
                    'data' => $json['data']
                ]);
            } else {
                return response()->json([
                    'error' => 'ไม่สามารถอัพเดทสถานะได้',
                    'details' => $json['message'] ?? 'Unknown error'
                ], $response->status());
            }
        } catch (\Exception $e) {
            Log::channel('tiktok_token_log')->error('🔥 TikTok Update Status API Exception: ' . $e->getMessage());
            return response()->json([
                'error' => 'เกิดข้อผิดพลาดในการอัพเดทสถานะ',
                'exception' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle TikTok webhook notifications
     * Example: POST /api/tiktok/webhook
     */
    public function handleWebhook(Request $request)
    {
        try {
            $payload = $request->all();
            
            Log::channel('tiktok_token_log')->info('🔔 TikTok Webhook Received', [
                'payload' => json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
                'headers' => $request->headers->all()
            ]);

            // ตรวจสอบ signature ของ webhook (ถ้า TikTok ส่งมา)
            $signature = $request->header('X-TikTok-Signature');
            if ($signature) {
                $expectedSignature = hash_hmac('sha256', $request->getContent(), $this->appSecret);
                if (!hash_equals($signature, $expectedSignature)) {
                    Log::channel('tiktok_token_log')->warning('❌ Webhook signature mismatch');
                    return response()->json(['error' => 'Invalid signature'], 403);
                }
            }

            // จัดการ event ต่างๆ
            $eventType = $payload['event_type'] ?? null;
            $eventData = $payload['data'] ?? [];

            switch ($eventType) {
                case 'message_received':
                    $this->handleNewMessage($eventData);
                    break;
                case 'conversation_status_updated':
                    $this->handleConversationStatusUpdate($eventData);
                    break;
                case 'conversation_created':
                    $this->handleNewConversation($eventData);
                    break;
                default:
                    Log::channel('tiktok_token_log')->info('📝 Unknown webhook event type: ' . $eventType);
            }

            return response()->json(['message' => 'Webhook processed successfully']);
        } catch (\Exception $e) {
            Log::channel('tiktok_token_log')->error('🔥 Webhook processing error: ' . $e->getMessage());
            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }

    /**
     * Handle new message webhook event
     */
    private function handleNewMessage($data)
    {
        Log::channel('tiktok_token_log')->info('📨 New message received', ['data' => $data]);
        
        // TODO: ใส่ logic การจัดการข้อความใหม่
        // เช่น บันทึกลงฐานข้อมูล, ส่ง notification, auto-reply, etc.
        
        // ตัวอย่างการบันทึกลง database
        // DB::table('tiktok_messages')->insert([
        //     'conversation_id' => $data['conversation_id'],
        //     'message_id' => $data['message_id'],
        //     'sender_type' => $data['sender_type'],
        //     'content' => json_encode($data['content']),
        //     'created_at' => now(),
        //     'updated_at' => now()
        // ]);
    }

    /**
     * Handle conversation status update webhook event
     */
    private function handleConversationStatusUpdate($data)
    {
        Log::channel('tiktok_token_log')->info('🔄 Conversation status updated', ['data' => $data]);
        
        // TODO: ใส่ logic การจัดการเมื่อสถานะการสนทนาเปลี่ยน
        // เช่น อัพเดท database, ส่ง notification, etc.
    }

    /**
     * Handle new conversation webhook event
     */
    private function handleNewConversation($data)
    {
        Log::channel('tiktok_token_log')->info('🆕 New conversation created', ['data' => $data]);
        
        // TODO: ใส่ logic การจัดการเมื่อมีการสนทนาใหม่
        // เช่น ส่ง welcome message อัตโนมัติ, assign agent, etc.
    }
}