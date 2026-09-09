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
            $request->boolean('inactive', false),
            $request->query('search'),
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 20),
        );
        if ($result['status']) {
            return response()->json([
                'message' => 'success',
                'list'    => $result['list'],
                'meta'    => $result['meta'],
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

    public function conversation(int $id): JsonResponse
    {
        $result = $this->kbService->conversation($id);
        if ($result['status']) {
            return response()->json([
                'message'  => 'success',
                'entry'    => $result['entry'],
                'customer' => $result['customer'],
                'messages' => $result['messages'],
            ]);
        }
        return response()->json(['message' => 'ไม่พบข้อมูล', 'detail' => $result['message']], 400);
    }

    public function update(int $id, Request $request): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $request->validate([
                'question' => 'required|string',
                'answer'   => 'required|string',
                'note'     => 'nullable|string',
                'tag_name' => 'nullable|string',
            ]);
            $result = $this->kbService->update(
                $id,
                $request->input('question'),
                $request->input('answer'),
                $request->input('note'),
                $request->input('tag_name'),
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

    public function approveEdited(int $id, Request $request): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $request->validate(['admin_answer' => 'required|string']);
            $admin  = Auth::user();
            $result = $this->kbService->approveEdited(
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

    public function toggleActive(int $id): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $result = $this->kbService->toggleActive($id);
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

    public function destroy(int $id): JsonResponse
    {
        $status = 400;
        $detail = 'ไม่มีข้อผิดพลาด';
        try {
            $result = $this->kbService->destroy($id);
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
