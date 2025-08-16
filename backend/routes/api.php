<?php

use App\Http\Controllers\AnnounceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BotMenuController;
use App\Http\Controllers\CaseController;
use App\Http\Controllers\ChatRoomsController;
use App\Http\Controllers\Chats\Line\HistoryController;
use App\Http\Controllers\Chats\Line\LineReceiveController;
use App\Http\Controllers\Chats\PushMessageController;
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
use App\Http\Controllers\TagGroupController;
use App\Http\Controllers\TagMenuController;
use App\Http\Controllers\TokenController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\webhooks\FacebookController;
use App\Http\Controllers\webhooks\LineUATController;
use App\Http\Middleware\UserAccess;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

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

    // จัดการเกี่ยวกับแชท
    Route::prefix('messages')->group(function () {
        // Route::post('/send', [MessageController::class, 'send']);
        Route::post('/send', [PushMessageController::class, 'pushMessage']);
        Route::post('/reply', [MessageController::class, 'reply']);
        Route::post('/receive', [LineReceiveController::class, 'receive']);
        Route::post('/sendTo', [MessageController::class, 'sendTo']);
        Route::post('/endTalk', [MessageController::class, 'endTalk']);
        Route::post('/pauseTalk', [MessageController::class, 'pauseTalk']);
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
        Route::get('/', [TagMenuController::class, 'list']);             // GET /tags
        Route::post('/', [TagMenuController::class, 'store']);           // POST /tags
        Route::put('{id}', [TagMenuController::class, 'update']);        // PUT /tags/{id}
        Route::delete('{id}', [TagMenuController::class, 'delete']);     // DELETE /tags/{id}
        Route::post('{id}/restore', [TagMenuController::class, 'restore']);
        Route::delete('{id}/force', [TagMenuController::class, 'forceDelete']);
    });

    Route::prefix('tag-group')->group(function () {
        Route::get('/', [TagGroupController::class, 'index']);              // GET /api/tag-group
        Route::get('{id}', [TagGroupController::class, 'show']);            // GET /api/tag-group/{id}
        Route::post('/', [TagGroupController::class, 'store']);             // POST /api/tag-group
        Route::match(['put', 'patch'], '{id}', [TagGroupController::class, 'update']); // PUT/PATCH /api/tag-group/{id}
        Route::delete('{id}', [TagGroupController::class, 'destroy']);      // DELETE /api/tag-group/{id}

        // SoftDeletes helpers
        Route::patch('{id}/restore', [TagGroupController::class, 'restore']); // PATCH /api/tag-group/{id}/restore
        Route::delete('{id}/force', [TagGroupController::class, 'forceDelete']); // DELETE /api/tag-group/{id}/force
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
    Route::prefix('facebook')->group(function () {
        Route::get('/', [FacebookController::class, 'webhook']);
        Route::post('/', [FacebookController::class, 'webhookFacebook']);
    });
    Route::prefix('test')->group(function () {
        Route::get('/facebook', [FacebookController::class, 'webhook']);
        Route::post('/facebook', function (Request $request) {
            return response()->json([
                'message' => 'Test webhook received successfully',
                'data' => $request->all(),
            ]);
        });
    });
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
