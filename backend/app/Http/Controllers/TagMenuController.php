<?php

namespace App\Http\Controllers;

use App\Services\TagService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TagMenuController extends Controller
{

    protected TagService $tagService;
    public function __construct(TagService $tagService){
        $this->tagService = $tagService;
    }
    public function list() : JsonResponse{
        $status = 400;
        $detail = 'ไม่พบข้อผิดพลาด';
        try {
            $list = $this->tagService->list();
            if ($list['status']) {
                $status = 200;
            }else throw new \Exception($list['message']);
            $message = $list['message'];
        }catch (\Exception $e){
            $detail = $e->getMessage();
        }finally{
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail' => $detail,
                'list' => $list['list'] ?? [],
            ],$status);
        }
    }

    public function store(Request $request) : JsonResponse{
        $status = 400;
        $detail = 'ไม่พบข้อผิดพลาด';
        try {
            $list = $this->tagService->store($request['tagName']);
            if ($list['status']) {
                $status = 200;
            }else throw new \Exception($list['message']);
            $message = $list['message'];
        }catch (\Exception $e){
            $detail = $e->getMessage();
        }finally{
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail' => $detail,
                'tag' => $list['tag'] ?? [],
            ],$status);
        }
    }

    public function update(Request $request) : JsonResponse{
        $status = 400;
        $detail = 'ไม่พบข้อผิดพลาด';
        try {
            $list = $this->tagService->update($request['tagName'], $request['id']);
            if ($list['status']) {
                $status = 200;
            }else throw new \Exception($list['message']);
            $message = $list['message'];
        }catch (\Exception $e){
            $detail = $e->getMessage();
        }finally{
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail' => $detail,
                'tag' => $list['tag'] ?? [],
            ],$status);
        }
    }

    public function delete($id): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่พบข้อผิดพลาด';
        try {
            $list = $this->tagService->delete($id);
            if ($list['status']) {
                $status = 200;
            }else throw new \Exception($list['message']);
            $message = $list['message'];
        }catch (\Exception $e){
            $detail = $e->getMessage();
        }finally{
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail' => $detail,
                'list' => $list['list'] ?? [],
            ],$status);
        }
    }
}
