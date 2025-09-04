<?php

namespace App\Http\Controllers;

use App\Http\Requests\ShortChatsRequest;
use App\Models\ShortChats;
use App\Services\ShortChatService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ShortChatController extends Controller
{
    protected ShortChatService $shortChatService;

    public function __construct(ShortChatService $shortChatService)
    {
        $this->shortChatService = $shortChatService;
    }

    public function list(): JsonResponse
    {
        $list = ShortChats::orderBy('created_at', 'desc')->get();
        $groups = ShortChats::select('groups as title')->groupBy('groups')->get();
        $models = ShortChats::select('models as title')->groupBy('models')->get();
        $problems = ShortChats::select('problems as title')->groupBy('problems')->get();
        $test = ShortChats::select(
            'content',
            DB::raw("string_agg(groups, ', ') as groups"),
            DB::raw("string_agg(models, ', ') as models"),
            DB::raw("string_agg(problems, ', ') as problems")
        )
            ->groupBy('content')
            ->get();
        return response()->json([
            'list' => $list,
            'groups' => $groups,
            'models' => $models,
            'problems' => $problems,
            'test' => $test
        ]);
    }

    public function ListGroups(): JsonResponse
    {
        $groups = ShortChats::select('groups as label')->groupBy('groups')->get();
        return response()->json([
            'list' => $groups,
        ]);
    }

    public function ListModels($group): JsonResponse
    {
        $models = ShortChats::select('models as label')->where('groups', $group)->groupBy('models')->get();
        return response()->json([
            'list' => $models,
        ]);
    }

    public function ListProblems($group, $model): JsonResponse
    {
        $problems = ShortChats::select('problems as label')
            ->where('groups', $group)
            ->where('models', $model)
            ->groupBy('problems')->get();
        return response()->json([
            'list' => $problems,
        ]);
    }

    public function ListContents($group, $model, $problem): JsonResponse
    {
        $contents = ShortChats::select('content as label')
            ->where('groups', $group)
            ->where('models', $model)
            ->where('problems', $problem)
            ->groupBy('content')->get();
        return response()->json([
            'list' => $contents,
        ]);
    }

    public function storeOrUpdate(ShortChatsRequest $request): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            DB::beginTransaction();
            $groups = $request['groups'];
            $models = $request['models'];
            $problems = $request['problems'];
            $content = $request['content'];

            foreach ($groups as $group) {
                foreach ($models as $model) {
                    foreach ($problems as $problem) {
                        ShortChats::create([
                            'content' => $content,
                            'groups' => $group['title'],
                            'models' => $model['title'],
                            'problems' => $problem['title'],
                        ]);
                        Log::info(Carbon::now());
                    }
                }
            }

            $message = 'สร้างข้อมูลสำเร็จ';
            $status = 200;
            DB::commit();
        } catch (\Exception $exception) {
            DB::rollBack();
            $detail = $exception->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail' => $detail,
            ], $status);
        }
    }


    public function delete($id): JsonResponse
    {
        $shortChat = ShortChats::find($id);
        if ($shortChat) {
            $shortChat->delete();
            return response()->json([
                'detail' => "ลบข้อมูลลูกค้าสำเร็จ สำหรับ ID $id"
            ], 200);
        } else {
            return response()->json([
                'detail' => "ไม่พบข้อมูลลูกค้าที่มี ID $id"
            ], 404);
        }
    }


}
