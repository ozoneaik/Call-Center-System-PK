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
use App\Http\Controllers\CustomersController;
use App\Http\Controllers\DisplayController;
use App\Http\Controllers\feedbackController;
use App\Http\Controllers\HelpChatController;
use App\Http\Controllers\KeywordController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotesController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\Secret\BotRoomController;
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

    //http://localhost:8000/api/webhooks/
    Route::post('/lazada', [LazadaController::class, 'handleWebhook']);
    Route::get('/lazada-new/callback', [LazadaNewController::class, 'handleCallback']);
    Route::post('/lazada/refresh-token', [LazadaNewController::class, 'refreshToken']);
    Route::get('/lazada/token/check-expiry/{seller_id}', [LazadaNewController::class, 'checkTokenExpiry']);
    // Route::get('/lazada/seller-info', [LazadaSellerController::class, 'getSellerInfo']);
});

//------------------------------- SHOPEE CHAT-------------------------------------------------------------------------------
//---------------------------- ขอ AccessToken ------------------------------------------------------------
//http://localhost:8000/api/
Route::get('/shopee/test-sign', [ShopeeTokenController::class, 'generateSign']);
//พอได้ access Token ให้เอาไปแทนใน env
Route::get('/shopee/access-token', [ShopeeTokenController::class, 'refreshToken']);

//------------------------------- SHOP INFO --------------------------------------------------------------
Route::get('/shopee/req-shop-info', [ShopeeShopController::class, 'requestShopInfo']);
Route::get('/shopee/shop-info', [ShopeeShopController::class, 'getShopInfo']);
//--------------------------------------------------------------------------------------------------------

//--------------------- Route เฉพาะสำหรับ Conversation List Require Raise Token ---------------------------
//ขอ Sign สำหรับดึงรายการแชท
Route::get('/shopee/conversations', [ShopeeShopController::class, 'getSignConversation']);
Route::get('/shopee/get-all-conversations', [ShopeeShopController::class, 'getAllConversations']);

//---------------------------- Route Helper Chat Shopee --------------------------------------------------
//Type:: shop_info //product_list //order_list //conversation_list //message_list //send_message
Route::get('/shopee/generate-sign/{api_type}', [ShopeeShopController::class, 'helperGenerateSign']);

//------------------------- Route สำหรับทดสอบ API จริง -----------------------------------------------------
//Type:: shop_info //product_list //order_list //conversation_list //message_list //send_message
Route::get('/shopee/test-api/{api_type}', [ShopeeShopController::class, 'testTypeAPI']);
//---------------------------------------------------------------------------------------------------------

Route::prefix('shopee-chat')->group(function () {

    // Debug และทดสอบ
    Route::get('debug-config', [ShopeeChatController::class, 'debugConfig']);
    Route::get('test-connection', [ShopeeChatController::class, 'testConnection']);
    Route::get('test-chat-api', [ShopeeChatController::class, 'testChatAPI']);

    // ข้อมูลร้านค้า
    Route::get('shop-info', [ShopeeChatController::class, 'getShopInfo']);

    // การสนทนา
    Route::get('conversations', [ShopeeChatController::class, 'getConversations']);
    Route::get('conversations/{conversation_id}/messages', [ShopeeChatController::class, 'getMessages']);

    // ส่งข้อความ
    Route::get('get-message', [ShopeeChatController::class, 'getMessages']);
    Route::post('send-message', [ShopeeChatController::class, 'sendMessage']);
    Route::post('send-image', [ShopeeChatController::class, 'sendImage']);
    Route::post('send-product', [ShopeeChatController::class, 'sendProduct']);

    // อัปเดตสถานะ
    Route::post('mark-as-read', [ShopeeChatController::class, 'markAsRead']);

    Route::get('debug-chat-sign', [ShopeeChatController::class, 'debugChatSignature']);
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
