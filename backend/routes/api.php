<?php

use App\Http\Controllers\AnnounceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BotMenuController;
use App\Http\Controllers\CaseController;
use App\Http\Controllers\ChatRoomsController;
use App\Http\Controllers\Chats\Lazada\LazadaReceiveController;
use App\Http\Controllers\Chats\Lazada\LazadaReplyController;
use App\Http\Controllers\Chats\Lazada\LazadaSendController;
use App\Http\Controllers\Chats\Lazada\LazadaSendToController;
use App\Http\Controllers\Chats\Line\HistoryController;
use App\Http\Controllers\Chats\Line\LineReceiveController;
use App\Http\Controllers\Chats\Shopee\ShopeeChatController;
use App\Http\Controllers\Chats\Shopee\ShopeeShopController;
use App\Http\Controllers\Chats\Shopee\ShopeeTokenController;
use App\Http\Controllers\Chats\Tiktok\TikTokShopController;
use App\Http\Controllers\CustomersController;
use App\Http\Controllers\DisplayController;
use App\Http\Controllers\feedbackController;
use App\Http\Controllers\HelpChatController;
use App\Http\Controllers\KeywordController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotesController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\Secret\BotRoomController;
use App\Http\Controllers\shopeeMessage\ShopeeReceiveController;
use App\Http\Controllers\shopeeMessage\ShopeeSendController;
use App\Http\Controllers\ShortChatController;
use App\Http\Controllers\StickerModelController;
use App\Http\Controllers\TagMenuController;
use App\Http\Controllers\TokenController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\webhooks\FacebookController;
use App\Http\Controllers\webhooks\LazadaController;
use App\Http\Controllers\webhooks\LazadaNewController;
use App\Http\Controllers\webhooks\LazadaSellerController;
use App\Http\Controllers\webhooks\LineUATController;
use App\Http\Controllers\webhooks\ShopeeWebhookController;
use App\Http\Controllers\webhooks\TiktokTokenController;
use App\Http\Middleware\UserAccess;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/test', function (\Illuminate\Http\Request $request) {
    $file = $request->file('file_upload');

    return response()->json([
        'message' => $request->all(),
        'file' => $file->getSize(),
    ]);
});

Route::middleware('auth:sanctum')->group(function () {
    // จัดการพนักงาน
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'user']);
    Route::prefix('users')->group(function () {
        Route::get('/list', [UserController::class, 'UserList']);
        Route::post('/store', [UserController::class, 'UserStore']);
        Route::put('/update/{empCode}', [UserController::class, 'UserUpdate']);
        Route::delete('/delete/{empCode}', [UserController::class, 'UserDelete']);
    });

    // จัดการลูกค้า
    Route::prefix('customers')->group(function () {
        Route::get('/list', [CustomersController::class, 'CustomerList']);
        Route::get('/detail/{custId}', [CustomersController::class, 'CustomerDetail']);
        Route::put('/update', [CustomersController::class, 'UpdateCustomer']);
    });

    // จัดการห้องแชท
    Route::prefix('chatRooms')->group(function () {
        Route::get('/list', [ChatRoomsController::class, 'list']);
        Route::post('/store', [ChatRoomsController::class, 'store']);
        Route::put('/update/{roomId}', [ChatRoomsController::class, 'update']);
        Route::delete('/delete/{roomId}', [ChatRoomsController::class, 'delete']);
    });

    Route::get('/myCase', [DisplayController::class, 'myCase']);

    //จัดการเกี่ยวกับแชท
    Route::prefix('messages')->group(function () {
        Route::post('/send', [MessageController::class, 'send']);
        Route::post('/reply', [MessageController::class, 'reply']);
        Route::post('/receive', [LineReceiveController::class, 'receive']);
        Route::post('/sendTo', [MessageController::class, 'sendTo']);
        Route::post('/endTalk', [MessageController::class, 'endTalk']);
        Route::post('/pauseTalk', [MessageController::class, 'pauseTalk']);


        Route::prefix('lazada')->group(function () {
            Route::post('/receive', [LazadaReceiveController::class, 'receive']);
            Route::post('/send', [LazadaSendController::class, 'send']);
            Route::post('/sendTo', [LazadaSendToController::class, 'sendTo']);
            Route::post('/reply', [LazadaReplyController::class, 'reply']);
            Route::post('/endTalk', [MessageController::class, 'endTalk']);
            Route::post('/pauseTalk', [MessageController::class, 'pauseTalk']);
        });

        Route::prefix('shopee')->group(function () {
            Route::post('/send', [ShopeeSendController::class, 'send']);
            Route::post('/receive', [ShopeeReceiveController::class, 'receive']);
        });
    });

    // ดึงข้อมูลเกี่ยวกับแชท
    Route::prefix('display')->group(function () {
        Route::get('/message/list/{roomId}', [DisplayController::class, 'displayMessageList']);
        Route::post('/select/{custId}/{from}', [DisplayController::class, 'selectMessage']);
    });

    // จัดการข้อความส่งด่วน
    Route::prefix('shortChats')->group(function () {
        Route::get('/list', [ShortChatController::class, 'list']);
        // แสดงตอนอยู่ในหน้าข้อความ
        Route::get('/list/groups', [ShortChatController::class, 'ListGroups']);
        Route::get('/list/models/{group}', [ShortChatController::class, 'ListModels']);
        Route::get('/list/problems/{group}/{model}', [ShortChatController::class, 'ListProblems']);
        Route::get('/list/contents/{group}/{model}/{problem}/', [ShortChatController::class, 'ListContents']);
        Route::middleware(UserAccess::class)->group(function () {
            Route::post('/store', [ShortChatController::class, 'storeOrUpdate']);
            Route::delete('/delete/{id}', [ShortChatController::class, 'delete']);
        });
    });

    // จัดการ note
    Route::prefix('notes')->group(function () {
        Route::get('/list', [NotesController::class, 'listAll']);
        Route::get('/selectNote/{custId}', [NotesController::class, 'selectNote']);
        Route::get('/list/{custId}', [NotesController::class, 'list']);
        Route::post('/store', [NotesController::class, 'store']);
        Route::put('/update', [NotesController::class, 'update']);
        Route::delete('/delete/{noteId}', [NotesController::class, 'delete']);
    });

    // จัดการ token
    Route::prefix('tokens')->group(function () {
        Route::post('/verify', [TokenController::class, 'verifyToken']);
        Route::get('list', [TokenController::class, 'list']);
        Route::post('store', [TokenController::class, 'store']);
        Route::put('update', [TokenController::class, 'update']);
        Route::delete('delete/{id}', [TokenController::class, 'delete']);
    });

    // จัดการ Dashboard
    Route::get('/dashboard', [DisplayController::class, 'Dashboard']);

    // จัดการข้อความส่วนตัว
    Route::get('/myMessages/{empCode}', [DisplayController::class, 'MyMessages']);

    //ดูประวัติแชททั้งหมด
    Route::get('/chatHistory', [HistoryController::class, 'ChatHistory']);
    Route::post('/chatHistory/{custId}', [HistoryController::class, 'ChatHistoryDetail']);

    // จัดการ BOT
    Route::prefix('bots')->group(function () {
        Route::get('list', [BotMenuController::class, 'list']);
        Route::post('storeOrUpdate', [BotMenuController::class, 'storeOrUpdate']);
    });

    // จัดการ Tag
    Route::prefix('tags')->group(function () {
        Route::get('list', [TagMenuController::class, 'list']);
        Route::post('store', [TagMenuController::class, 'store']);
        Route::put('update', [TagMenuController::class, 'update']);
        Route::delete('delete/{id}', [TagMenuController::class, 'delete']);
    });

    //จัดการ keyword
    Route::prefix('keywords')->group(function () {
        Route::get('list', [KeywordController::class, 'list']);
        Route::post('store', [KeywordController::class, 'store']);
        Route::put('update/{id}', [KeywordController::class, 'update']);
        Route::delete('delete/{id}', [KeywordController::class, 'delete']);
    });

    //สำหรับจัดการแชทที่ค้างไว้
    Route::post('/endTalkAllProgress/{roomId}', [MessageController::class, 'endTalkAllProgress']);
    Route::post('/endTalkAllPending/{roomId}', [MessageController::class, 'endTalkAllPending']);


    //จัดการรายงาน
    Route::prefix('reports')->group(function () {
        Route::get('listLine', [ReportController::class, 'LineList']);
        Route::get('rateList', [ReportController::class, 'RateList']);
        Route::get('activeList', [ReportController::class, 'activeList']);
        Route::get('fullReport', [ReportController::class, 'FullReport']);
        Route::get('tagReports', [ReportController::class, 'TagReport']);
    });

    // จัดการข้อมูลส่วนตัว
    Route::prefix('users')->group(function () {
        Route::get('profile', [UserController::class, 'profile']);
        Route::post('profile', [UserController::class, 'updateProfile']);
    });

    // จัดการเคส
    Route::prefix('case')->group(function () {
        Route::post('/store', [CaseController::class, 'store']);
    });

    Route::prefix('help-chat')->group(function () {
        Route::get('/list', [HelpChatController::class, 'index']);
        Route::post('/search', [HelpChatController::class, 'search']);
        Route::post('/store', [HelpChatController::class, 'store']);
        Route::put('{id}', [HelpChatController::class, 'update']);
        Route::delete('{id}', [HelpChatController::class, 'destroy']);
    });

    Route::get('/bot-room', [BotRoomController::class, 'index']);
    Route::post('/bot-room/{rateId}/{roomId}', [BotRoomController::class, 'changeRoomByOne']);


    // จัดการสติกเกอร์
    Route::prefix('sticker')->group(function () {
        Route::get('/list', [StickerModelController::class, 'index']);
        Route::post('/store', [StickerModelController::class, 'store']);
        Route::put('/update/{id}', [StickerModelController::class, 'update']);
        Route::delete('/delete/{id}', [StickerModelController::class, 'delete']);
    });
});

Route::prefix('webhooks')->group(function () {
    Route::post('/line', [LineUATController::class, 'webhook']);
    Route::get('/facebook', [FacebookController::class, 'webhook']);
    Route::post('/facebook', [FacebookController::class, 'webhookFacebook']);

    Route::post('/lazada', [LazadaController::class, 'handleWebhook']);
    Route::get('/lazada-new/callback', [LazadaNewController::class, 'handleCallback']);
    Route::post('/lazada/refresh-token', [LazadaNewController::class, 'refreshToken']);
    Route::get('/lazada/token/check-expiry/{seller_id}', [LazadaNewController::class, 'checkTokenExpiry']);

    Route::post('/lazada/sign', [LazadaController::class, 'sign'])
        ->middleware('throttle:60,1'); // กันยิงถี่เกินไป
    Route::post('/lazada/test-send-video', [LazadaController::class, 'sendVideoTest']);

    // Route::get('/lazada/seller-info', [LazadaSellerController::class, 'getSellerInfo']);

    //https://e0c2e59fd590.ngrok-free.app/api/webhooks/tiktok/callback?code=TESTCODE123&state=xyz
    Route::get('/tiktok/callback', [TiktokTokenController::class, 'getAccessToken']);

    //http://localhost:8000/api/webhooks/tiktok/refresh/4gPXdwAAAAB7HWd9mn6rjsgcvelGBum-Qct-Jg2XItHDSi0TDI7wbw
    Route::get('/tiktok/refresh/{open_id}', [TiktokTokenController::class, 'refreshAccessToken']);
    Route::get('/tiktok/get-shops', [TikTokShopController::class, 'getAuthorizedShops']);
    Route::get('/tiktok/order-detail', [TikTokShopController::class, 'getOrderDetail']);

    Route::prefix('tiktok')->group(function () {
        // Existing routesw
        Route::get('/authorized-shops', [TikTokShopController::class, 'getAuthorizedShops']);
        Route::get('/order-detail', [TikTokShopController::class, 'getOrderDetail']);

        // New conversation routes
        Route::get('/conversations', [TikTokShopController::class, 'getConversations']);
        Route::get('/conversation/{conversationId}', [TikTokShopController::class, 'getConversationDetail']);
        Route::get('/conversation/{conversationId}/messages', [TikTokShopController::class, 'getConversationMessages']);
        Route::post('/conversation/{conversationId}/send', [TikTokShopController::class, 'sendMessage']);
        Route::put('/conversation/{conversationId}/status', [TikTokShopController::class, 'updateConversationStatus']);

        // Webhook route
        Route::post('/webhook', [TikTokShopController::class, 'handleWebhook']);
    });
});

//------------------------------- SHOPEE CHAT-------------------------------------------------------------------------------
//Type:: shop_info //product_list //order_list //conversation_list //message_list //send_message //get_message
// Route::get('/shopee/generate-sign/{api_type}', [ShopeeShopController::class, 'helperGenerateSign']);
// Route::get('/shopee/test-api/{api_type}', [ShopeeShopController::class, 'testTypeAPI']);

//http://localhost:8000/api/shopee-chat/shopee/
Route::prefix('shopee-chat')->group(function () {
    Route::get('/shopee/test-sign', [ShopeeTokenController::class, 'generateSign']);
    Route::get('/shopee/access-token', [ShopeeTokenController::class, 'refreshToken']);
    Route::get('/test-connection', [ShopeeChatController::class, 'testConnection']);

    //     // ข้อมูลร้านค้า
    //     //http://localhost:8000/api/shopee-chat/shopee/shop-info
    //     Route::get('/shopee/shop-info', [ShopeeChatController::class, 'getShopInfo']);

    //     //http://localhost:8000/api/shopee-chat/shopee/orders
    //     Route::get('/shopee/orders', [ShopeeChatController::class, 'listOrders']);
    //     //http://localhost:8000/api/shopee-chat/shopee/order-detail
    //     Route::get('/shopee/order-detail', [ShopeeChatController::class, 'getOrderDetail']);

    //     //http://localhost:8000/api/shopee-chat/shopee/conversations
    //     Route::get('/shopee/conversations', [ShopeeChatController::class, 'listConversations']);
    //     Route::get('/shopee/conversations/{conversationId}', [ShopeeChatController::class, 'getConversation']);
    //     //http://localhost:8000/api/shopee-chat/shopee/conversations/245670446880913293/messages
    //     Route::get('/shopee/conversations/{conversationId}/messages', [ShopeeChatController::class, 'getMessages']);

    //     //Method: DELETE
    //     //URL:http: //your-app.test/api/shopee/conversations
    //     //{"conversation_id": "245670446880913293"}
    //     Route::delete('/shopee/conversations', [ShopeeChatController::class, 'deleteConversation']);

    //     //http://localhost:8000/api/shopee-chat/shopee/messages
    //     Route::post('/shopee/messages', [ShopeeChatController::class, 'sendMessage']);
    //     Route::post('/shopee/images', [ShopeeChatController::class, 'uploadImage']);
    //     Route::post('/shopee/messages/delete', [ShopeeChatController::class, 'deleteMessage']);

    //http://localhost:8000/api/shopee-chat/shopee/chat/57198184/conversation/245670446880913293
    //http://localhost:8000/api/shopee-chat/shopee/chat/57198184/send-message
    //http://localhost:8000/api/shopee-chat/shopee/chat/57198184/upload-video
    //http://localhost:8000/api/shopee-chat/shopee/chat/57198184/video-result/th-11110120-6kh4a-mclkayrdi4u86d
    //245670446880913293
    Route::prefix('shopee/chat/{shopId}')->group(function () {
        Route::get('info', [ShopeeChatController::class, 'getShopInfo']);
        Route::get('conversations', [ShopeeChatController::class, 'listConversations']);
        Route::get('conversation/{conversationId}', [ShopeeChatController::class, 'getConversation']);
        Route::get('messages/{conversationId}', [ShopeeChatController::class, 'getMessages']);
        Route::post('send-message', [ShopeeChatController::class, 'sendMessage']);
        Route::post('upload-image', [ShopeeChatController::class, 'uploadImage']);
        Route::post('upload-video', [ShopeeChatController::class, 'uploadVideo']);
        Route::get('video-result/{vid}', [ShopeeChatController::class, 'getVideoUploadResult']);
    });
});
//-------------------------------------------------------------------------------------------------------------------------

Route::post('/upload-file', [MessageController::class, 'uploadFile']);

Route::get('/announces', [AnnounceController::class, 'index']);
Route::get('/announces/list', [AnnounceController::class, 'list_all']);
Route::put('/announces/{id}', [AnnounceController::class, 'update']);
Route::post('/announces', [AnnounceController::class, 'store']);
Route::delete('/announces/{id}', [AnnounceController::class, 'destroy']);

Route::get('/feedback/{custId}/{rateId}', [feedbackController::class, 'index']);
Route::post('/feedback', [feedbackController::class, 'feedback']);

require __DIR__ . '/test_only.php';
