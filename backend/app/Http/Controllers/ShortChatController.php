<?php

namespace App\Http\Controllers;

use App\Models\ShortChats;
use App\Services\ShortChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Psy\Util\Json;

class ShortChatController extends Controller
{
    protected ShortChatService $shortChatService;

    public function __construct(ShortChatService $shortChatService)
    {
        $this->shortChatService = $shortChatService;
    }

    public function list(): JsonResponse
    {
        return response()->json([
            'list' => $this->shortChatService->list(),
        ]);
    }

    public function ListModels($group): JsonResponse
    {
        $models = ShortChats::select('models')->where('groups', $group)->groupBy('models')->get();
        return response()->json([
            'list' => $models,
        ]);
    }

    public function ListProblems($group, $model): JsonResponse
    {
        $problems = ShortChats::select('problems')
            ->where('groups', $group)
            ->where('models', $model)
            ->groupBy('problems')->get();
        return response()->json([
            'list' => $problems,
        ]);
    }

    public function ListContents($group, $model, $problem): JsonResponse{
        $contents = ShortChats::select('content')
            ->where('groups', $group)
            ->where('models', $model)
            ->where('problems', $problem)
            ->groupBy('content')->get();
        return response()->json([
            'list' => $contents,
        ]);
    }

    public function storeOrUpdate(Request $request): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            if (empty($request['content'])) throw new \Exception('ไม่พบข้อความส่งด่วนที่จะเพิ่ม');
            $checkContent = ShortChats::where('id', $request['id'])->first();
            if ($checkContent) {
                $checkContent['content'] = $request['content'];
                if (!$checkContent->save()) throw new \Exception('ไม่สามารถสร้างข้อความส่งด่วนใหม่ได้ เกิดปัญหาบางอย่าง');
            } else {
                $store = ShortChats::create([
                    'content' => $request['content']
                ]);
                if (!$store) throw new \Exception('ไม่สามารถสร้างข้อความส่งด่วนใหม่ได้ เกิดปัญหาบางอย่าง');
            }
            $message = 'สร้างข้อมูลสำเร็จ';
            $status = 200;
        } catch (\Exception $exception) {
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
