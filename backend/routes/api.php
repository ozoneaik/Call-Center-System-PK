<?php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BotMenuController;
use App\Http\Controllers\ChatRoomsController;
use App\Http\Controllers\CustomersController;
use App\Http\Controllers\DisplayController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotesController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ShortChatController;
use App\Http\Controllers\TagMenuController;
use App\Http\Controllers\TokenController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\UserAccess;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/test',function (\Illuminate\Http\Request $request) {
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

    // จัดการเกี่ยวกับแชท
    Route::prefix('messages')->group(function () {
        Route::post('/send', [MessageController::class, 'send']);
        Route::post('/receive', [MessageController::class, 'receive']);
        Route::post('/sendTo', [MessageController::class, 'sendTo']);
        Route::post('/endTalk', [MessageController::class, 'endTalk']);
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
       Route::get('/list/{custId}', [NotesController::class, 'list']);
       Route::post('/store', [NotesController::class, 'store']);
       Route::put('/update', [NotesController::class, 'update']);
       Route::delete('/delete/{noteId}', [NotesController::class, 'delete']);
    });

    // จัดการ token
    Route::prefix('tokens')->group(function () {
        Route::post('/verify', [TokenController::class, 'verifyToken']);
        Route::get('list',[TokenController::class, 'list']);
        Route::post('store',[TokenController::class, 'store']);
        Route::put('update',[TokenController::class, 'update']);
        Route::delete('delete/{id}',[TokenController::class, 'delete']);
    });

    // จัดการ Dashboard
    Route::get('/dashboard',[DisplayController::class, 'Dashboard']);

    // จัดการข้อความส่วนตัว
    Route::get('/myMessages/{empCode}',[DisplayController::class, 'MyMessages']);

    //ดูประวัติแชททั้งหมด
    Route::get('/chatHistory',[DisplayController::class, 'ChatHistory']);

    // จัดการ BOT
    Route::prefix('bots')->group(function () {
       Route::get('list',[BotMenuController::class,'list']);
       Route::post('storeOrUpdate',[BotMenuController::class,'storeOrUpdate']);
    });

    // จัดการ Tag
    Route::prefix('tags')->group(function () {
        Route::get('list',[TagMenuController::class, 'list']);
        Route::post('store',[TagMenuController::class,'store']);
        Route::put('update',[TagMenuController::class,'update']);
        Route::delete('delete/{id}',[TagMenuController::class,'delete']);
    });

    //สำหรับจัดการแชทที่ค้างไว้ 
    Route::post('/endTalkAllProgress/{roomId}',[MessageController::class, 'endTalkAllProgress']);
    Route::post('/endTalkAllPending/{roomId}',[MessageController::class, 'endTalkAllPending']);


    //จัดการรายงาน
    Route::prefix('reports')->group(function () {
        Route::get('listLine', [ReportController::class, 'LineList']);
        Route::get('rateList', [ReportController::class, 'RateList']);
        Route::get('activeList', [ReportController::class, 'activeList']);
        Route::get('fullReport', [ReportController::class, 'FullReport']);
    });
});



