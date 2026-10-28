<?php

use App\Http\Controllers\AnnounceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BotMenuController;
use App\Http\Controllers\CaseController;
use App\Http\Controllers\ChatRoomsController;
use App\Http\Controllers\Chats\Line\HistoryController;
use App\Http\Controllers\Chats\Line\LineReceiveController;
use App\Http\Controllers\Chats\Line\RetryMediaController;
use App\Http\Controllers\Chats\PushMessageController;
use App\Http\Controllers\CustomersController;
use App\Http\Controllers\DisplayController;
use App\Http\Controllers\External\ExternalChatController;
use App\Http\Controllers\feedbackController;
use App\Http\Controllers\HelpChatController;
use App\Http\Controllers\KeywordController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotesController;
use App\Http\Controllers\PlatformTokenController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\Secret\BotRoomController;
use App\Http\Controllers\ShortChatController;
use App\Http\Controllers\StickerModelController;
use App\Http\Controllers\TagGroupController;
use App\Http\Controllers\TagMenuController;
use App\Http\Controllers\TagsByPlatformController;
use App\Http\Controllers\TokenController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\AiAssistantController;
use App\Http\Controllers\AiKbEntryController;
use App\Http\Controllers\KnowledgeBaseController;
use App\Http\Controllers\PlatformRoutingController;
use App\Http\Controllers\webhooks\LineUATController;
use App\Http\Controllers\webhooks\new\NewLazadaController;
use App\Http\Controllers\webhooks\new\NewShopeeController;
use App\Http\Middleware\UserAccess;
use App\Models\TagGroup;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

    require __DIR__ . '/home.php';

    // จัดการพนักงาน
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'user']);
    Route::prefix('users')->group(function () {
        Route::get('/list', [UserController::class, 'UserList']);
        Route::post('/store', [UserController::class, 'UserStore'])->middleware('menu:users');
        Route::put('/update/{empCode}', [UserController::class, 'UserUpdate'])->middleware('menu:users');
        Route::delete('/delete/{empCode}', [UserController::class, 'UserDelete'])->middleware('menu:users');
    });

    // จัดการลูกค้า
    Route::prefix('customers')->group(function () {
        Route::get('/list', [CustomersController::class, 'CustomerList']);
        Route::get('/detail/{custId}', [CustomersController::class, 'CustomerDetail']);
        Route::get('/history-summary/{custId}', [CustomersController::class, 'HistorySummary']);
        Route::put('/update', [CustomersController::class, 'UpdateCustomer'])->middleware('menu:customers');
    });

    // จัดการวันหยุด
    Route::prefix('holidays')->group(function () {
        Route::get('/list', [HolidayController::class, 'index']);
        Route::post('/store', [HolidayController::class, 'store'])->middleware('menu:holidays');
        Route::put('/update/{id}', [HolidayController::class, 'update'])->middleware('menu:holidays');
        Route::delete('/delete/{id}', [HolidayController::class, 'destroy'])->middleware('menu:holidays');
    });

    // จัดการห้องแชท
    Route::prefix('chatRooms')->group(function () {
        Route::get('/list', [ChatRoomsController::class, 'list']);
        Route::post('/store', [ChatRoomsController::class, 'store'])->middleware('menu:chat_rooms');
        Route::put('/update/{roomId}', [ChatRoomsController::class, 'update'])->middleware('menu:chat_rooms');
        Route::delete('/delete/{roomId}', [ChatRoomsController::class, 'delete'])->middleware('menu:chat_rooms');
    });

    Route::get('/myCase', [DisplayController::class, 'myCase']);

    // จัดการเกี่ยวกับแชท
    Route::prefix('messages')->group(function () {
        // Route::post('/send', [MessageController::class, 'send']);
        Route::post('/send', [PushMessageController::class, 'pushMessage']);
        Route::post('/reply', [MessageController::class, 'reply']);
        Route::post('/receive', [LineReceiveController::class, 'receive']);
        Route::post('/sendTo', [MessageController::class, 'sendTo']);
        Route::post('/endTalk', [MessageController::class, 'endTalk']);
        Route::post('/pauseTalk', [MessageController::class, 'pauseTalk']);
        Route::post('/retry-media', [RetryMediaController::class, 'retryMedia']);
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
        Route::middleware('menu:short_chats')->group(function () {
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
        Route::post('store', [TokenController::class, 'store'])->middleware('menu:tokens');
        Route::put('update', [TokenController::class, 'update'])->middleware('menu:tokens');
        Route::delete('delete/{id}', [TokenController::class, 'delete'])->middleware('menu:tokens');
    });

    Route::prefix('auto-tokens')->group(function () {
        Route::get('/rooms', [PlatformTokenController::class, 'listRooms']);

        Route::get('/token/shopee/auth-url', [PlatformTokenController::class, 'shopeeAuthUrl']);
        Route::post('/token/shopee/exchange', [PlatformTokenController::class, 'shopeeExchange'])->middleware('menu:auto_tokens');
        Route::get('/callback/shopee', [PlatformTokenController::class, 'shopeeCallback']);

        // Lazada
        Route::get('/token/lazada/auth-url', [PlatformTokenController::class, 'lazadaAuthUrl']);
        Route::post('/token/lazada/exchange', [PlatformTokenController::class, 'lazadaExchange'])->middleware('menu:auto_tokens');
        Route::get('/callback/lazada', [PlatformTokenController::class, 'lazadaCallback']);

        //tiitok
        Route::get('/token/tiktok/auth-url', [PlatformTokenController::class, 'tiktokAuthUrl']);
        Route::post('/token/tiktok/exchange', [PlatformTokenController::class, 'tiktokExchange'])->middleware('menu:auto_tokens');
        Route::get('/callback/tiktok', [PlatformTokenController::class, 'tiktokCallback']);

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
        Route::post('storeOrUpdate', [BotMenuController::class, 'storeOrUpdate'])->middleware('menu:bot_menu');
    });

    // จัดการ Tag
    Route::prefix('tags')->group(function () {
        Route::get('/', [TagMenuController::class, 'list']);             // GET /tags
        Route::post('/', [TagMenuController::class, 'store'])->middleware('menu:tags');           // POST /tags
        Route::put('{id}', [TagMenuController::class, 'update'])->middleware('menu:tags');        // PUT /tags/{id}
        Route::delete('{id}', [TagMenuController::class, 'delete'])->middleware('menu:tags');     // DELETE /tags/{id}
        Route::post('{id}/restore', [TagMenuController::class, 'restore'])->middleware('menu:tags');
        Route::delete('{id}/force', [TagMenuController::class, 'forceDelete'])->middleware('menu:tags');
    });

    Route::prefix('tag-group')->group(function () {
        Route::get('options', [TagGroupController::class, 'options']);
        Route::get('/', [TagGroupController::class, 'index']);              // GET /api/tag-group
        Route::get('{id}', [TagGroupController::class, 'show']);            // GET /api/tag-group/{id}
        Route::post('/', [TagGroupController::class, 'store'])->middleware('menu:tags');             // POST /api/tag-group
        Route::match(['put', 'patch'], '{id}', [TagGroupController::class, 'update'])->middleware('menu:tags'); // PUT/PATCH /api/tag-group/{id}
        Route::delete('{id}', [TagGroupController::class, 'destroy'])->middleware('menu:tags');      // DELETE /api/tag-group/{id}

        // SoftDeletes helpers
        Route::patch('{id}/restore', [TagGroupController::class, 'restore'])->middleware('menu:tags'); // PATCH /api/tag-group/{id}/restore
        Route::delete('{id}/force', [TagGroupController::class, 'forceDelete'])->middleware('menu:tags'); // DELETE /api/tag-group/{id}/force

    });

    Route::prefix('tags-by-platform')->group(function () {
        Route::get('/', [TagsByPlatformController::class, 'index']);
        Route::post('/', [TagsByPlatformController::class, 'store'])->middleware('menu:tags');
        Route::get('/platforms', [TagsByPlatformController::class, 'platforms']);
        Route::get('/tags', [TagsByPlatformController::class, 'tags']);
        Route::get('/{id}', [TagsByPlatformController::class, 'show']);
        Route::put('/{id}', [TagsByPlatformController::class, 'update'])->middleware('menu:tags');
        Route::delete('/{id}', [TagsByPlatformController::class, 'destroy'])->middleware('menu:tags');
    });

    //จัดการ keyword
    Route::prefix('keywords')->group(function () {
        Route::get('list', [KeywordController::class, 'list']);
        Route::post('store', [KeywordController::class, 'store'])->middleware('menu:keywords');
        Route::put('update/{id}', [KeywordController::class, 'update'])->middleware('menu:keywords');
        Route::delete('delete/{id}', [KeywordController::class, 'delete'])->middleware('menu:keywords');
    });

    //สำหรับจัดการแชทที่ค้างไว้
    Route::post('/endTalkAllProgress/{roomId}', [MessageController::class, 'endTalkAllProgress']);
    Route::post('/endTalkAllPending/{roomId}', [MessageController::class, 'endTalkAllPending']);


    //จัดการรายงาน
    Route::prefix('reports')->middleware('menu:reports')->group(function () {
        Route::get('listLine', [ReportController::class, 'LineList']);
        Route::get('rateList', [ReportController::class, 'RateList']);
        Route::get('activeList', [ReportController::class, 'activeList']);
        Route::get('fullReport', [ReportController::class, 'FullReport']);
        Route::get('tagReports', [ReportController::class, 'TagReport']);

        Route::get('reportExcel', [ReportController::class, 'index']);
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
        Route::post('/store', [HelpChatController::class, 'store'])->middleware('menu:help_chat');
        // Route::put('{id}', [HelpChatController::class, 'update']);
        // Route::delete('{id}', [HelpChatController::class, 'destroy']);

        Route::put('/update/{id}', [HelpChatController::class, 'update'])->middleware('menu:help_chat');
        Route::delete('/delete/{id}', [HelpChatController::class, 'destroy'])->middleware('menu:help_chat');
    });

    Route::get('/bot-room', [BotRoomController::class, 'index']);
    Route::post('/bot-room/{rateId}/{roomId}', [BotRoomController::class, 'changeRoomByOne']);


    // จัดการสติกเกอร์
    Route::prefix('sticker')->group(function () {
        Route::get('/list', [StickerModelController::class, 'index']);
        Route::post('/store', [StickerModelController::class, 'store'])->middleware('menu:sticker');
        Route::put('/update/{id}', [StickerModelController::class, 'update'])->middleware('menu:sticker');
        Route::delete('/delete/{id}', [StickerModelController::class, 'delete'])->middleware('menu:sticker');
    });

    // จัดการ routing rules ของ platform
    Route::prefix('platform-routing')->group(function () {
        Route::get('/', [PlatformRoutingController::class, 'index']);
        Route::post('/update-rules', [PlatformRoutingController::class, 'updateRules'])->middleware('menu:platform_routing');
        Route::get('/allowed-rooms/{tokenId}', [PlatformRoutingController::class, 'allowedRooms']);
    });

    // Knowledge Base (ai_kb_entries — รายการที่พนักงานกด "เพิ่มเข้า KB" เองจากหน้าแชท)
    Route::prefix('knowledge-base')->group(function () {
        Route::get('/stats', [KnowledgeBaseController::class, 'stats']);
        Route::get('/list', [KnowledgeBaseController::class, 'list']);
        Route::get('/show/{id}', [KnowledgeBaseController::class, 'show']);
        Route::get('/conversation/{id}', [KnowledgeBaseController::class, 'conversation']);
        Route::get('/tags', [KnowledgeBaseController::class, 'tags']);
        Route::put('/update/{id}', [KnowledgeBaseController::class, 'update'])->middleware('menu:knowledge_base');
        Route::put('/approve/{id}', [KnowledgeBaseController::class, 'approve'])->middleware('menu:knowledge_base');
        Route::put('/reject/{id}', [KnowledgeBaseController::class, 'reject'])->middleware('menu:knowledge_base');
        Route::put('/approve-edited/{id}', [KnowledgeBaseController::class, 'approveEdited'])->middleware('menu:knowledge_base');
        Route::put('/reset/{id}', [KnowledgeBaseController::class, 'resetPending'])->middleware('menu:knowledge_base');
        Route::put('/toggle-active/{id}', [KnowledgeBaseController::class, 'toggleActive'])->middleware('menu:knowledge_base');
        Route::get('/auto-reply/list', [KnowledgeBaseController::class, 'autoReplyList']);
        Route::put('/auto-reply', [KnowledgeBaseController::class, 'setAutoReply'])->middleware('menu:knowledge_base');
        Route::get('/auto-reply/settings', [KnowledgeBaseController::class, 'autoReplySettings']);
        Route::put('/auto-reply/settings', [KnowledgeBaseController::class, 'updateAutoReplySettings'])->middleware('menu:knowledge_base');
        Route::get('/auto-reply/logs', [KnowledgeBaseController::class, 'autoReplyLogs']);
        Route::get('/auto-reply/test', [KnowledgeBaseController::class, 'autoReplyTest']);
        Route::put('/alt/{id}', [KnowledgeBaseController::class, 'updateAlt'])->middleware('menu:knowledge_base');
        Route::delete('/delete/{id}', [KnowledgeBaseController::class, 'destroy'])->middleware('menu:knowledge_base');
    });

    // AI Assistant (แชท) - suggestions: ค้นคลังความรู้จริง (ai_kb_entries + knowledge_base_entries) | customer-analysis: ยังรอเฟสวิเคราะห์ประวัติ
    Route::prefix('ai-assistant')->group(function () {
        Route::get('/suggestions/{activeId}', [AiAssistantController::class, 'suggestions']);
        Route::get('/live-suggestions/{activeId}', [AiAssistantController::class, 'liveSuggestionsHistory']);
        Route::get('/customer-analysis/{custId}', [AiAssistantController::class, 'customerAnalysis']);
        Route::post('/chat-oc-any', [AiAssistantController::class, 'liveSuggest']);
        Route::post('/send-brochure-page', [AiAssistantController::class, 'sendBrochurePage']);
        Route::post('/kb-entries', [AiKbEntryController::class, 'store']);
    });
});


Route::prefix('webhooks')->group(function () {
    Route::post('/line', [LineUATController::class, 'webhook']);
});
Route::post('/upload-file', [MessageController::class, 'uploadFile']);

Route::get('/announces', [AnnounceController::class, 'index']);
Route::get('/announces/list', [AnnounceController::class, 'list_all']);
Route::put('/announces/{id}', [AnnounceController::class, 'update']);
Route::post('/announces', [AnnounceController::class, 'store']);
Route::delete('/announces/{id}', [AnnounceController::class, 'destroy']);

Route::get('/feedback/{custId}/{rateId}', [feedbackController::class, 'index']);
Route::post('/feedback', [feedbackController::class, 'feedback']);

require __DIR__ . '/test_only.php';
require __DIR__ . '/webhook.php';

Route::get('report', [ReportController::class, 'index']);

// Route::get('/ping', function () {
//     return response()->json([
//         'status' => 'success',
//         'message' => 'Pong! 🏓',
//         'server_time' => now()->toDateTimeString(),
//         'your_ip' => request()->ip()
//     ]);
// });

// Route::post('/external/save-chat', [ExternalChatController::class, 'store']);

Route::get('/shopee/products/search', [NewShopeeController::class, 'searchProducts']);

Route::get('/lazada/products/search', [NewLazadaController::class, 'searchProducts']);