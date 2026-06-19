<?php

namespace App\Http\Controllers;

use App\Services\KnowledgeBaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class KnowledgeBaseController extends Controller
{
    protected KnowledgeBaseService $kbService;

    public function __construct(KnowledgeBaseService $kbService)
    {
        $this->kbService = $kbService;
    }

    public function stats(): JsonResponse
    {
        $result = $this->kbService->stats();
        if ($result['status']) {
            return response()->json($result['stats']);
        }
        return response()->json(['message' => 'เกิดข้อผิดพลาด'], 400);
    }

    public function list(Request $request): JsonResponse
    {
        $result = $this->kbService->list(
            $request->query('status'),
            $request->query('tag_name'),
            $request->boolean('excluded', false),
        );
        if ($result['status']) {
            return response()->json([
                'message' => 'success',
                'list'    => $result['list'],
            ]);
        }
        return response()->json(['message' => 'เกิดข้อผิดพลาด', 'detail' => $result['message']], 400);
    }

    public function tags(): JsonResponse
    {
        $result = $this->kbService->tags();
        if ($result['status']) {
            return response()->json($result['tags']);
        }
        return response()->json([], 400);
    }

    public function exclude(int $id): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $result = $this->kbService->exclude($id);
            if ($result['status']) { $status = 200; $message = $result['message']; }
            else throw new \Exception($result['message']);
        } catch (\Exception $e) { $detail = $e->getMessage(); } finally {
            return response()->json(['message' => $message ?? 'เกิดข้อผิดพลาด', 'detail' => $detail], $status);
        }
    }

    public function restore(int $id): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $result = $this->kbService->restore($id);
            if ($result['status']) { $status = 200; $message = $result['message']; }
            else throw new \Exception($result['message']);
        } catch (\Exception $e) { $detail = $e->getMessage(); } finally {
            return response()->json(['message' => $message ?? 'เกิดข้อผิดพลาด', 'detail' => $detail], $status);
        }
    }

    public function show(int $id): JsonResponse
    {
        $result = $this->kbService->show($id);
        if ($result['status']) {
            return response()->json([
                'message' => 'success',
                'entry'   => $result['entry'],
            ]);
        }
        return response()->json(['message' => 'ไม่พบข้อมูล', 'detail' => $result['message']], 400);
    }

    public function approve(int $id): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $admin  = Auth::user();
            $result = $this->kbService->approve($id, $admin->id, $admin->real_name ?? $admin->name);
            if ($result['status']) {
                $status  = 200;
                $message = $result['message'];
            } else throw new \Exception($result['message']);
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail'  => $detail,
            ], $status);
        }
    }

    public function reject(int $id, Request $request): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $request->validate(['admin_answer' => 'required|string']);
            $admin  = Auth::user();
            $result = $this->kbService->reject(
                $id,
                $admin->id,
                $admin->real_name ?? $admin->name,
                $request->input('admin_answer'),
                $request->input('admin_note')
            );
            if ($result['status']) {
                $status  = 200;
                $message = $result['message'];
            } else throw new \Exception($result['message']);
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail'  => $detail,
            ], $status);
        }
    }

    public function updateAi(int $id, Request $request): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $request->validate([
                'ai_topic'  => 'required|string|max:500',
                'ai_answer' => 'required|string',
            ]);
            $result = $this->kbService->updateAi($id, $request->input('ai_topic'), $request->input('ai_answer'));
            if ($result['status']) {
                $status  = 200;
                $message = $result['message'];
            } else throw new \Exception($result['message']);
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail'  => $detail,
            ], $status);
        }
    }

    public function resetPending(int $id): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $result = $this->kbService->resetPending($id);
            if ($result['status']) {
                $status  = 200;
                $message = $result['message'];
            } else throw new \Exception($result['message']);
        } catch (\Exception $e) {
            $detail = $e->getMessage();
        } finally {
            return response()->json([
                'message' => $message ?? 'เกิดข้อผิดพลาด',
                'detail'  => $detail,
            ], $status);
        }
    }
}
