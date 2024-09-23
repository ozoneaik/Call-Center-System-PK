<?php

namespace App\Http\Controllers;

use App\Services\ActiveConversationService;
use App\Services\PusherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActiveConversationsController extends Controller
{
    protected ActiveConversationService $activeConversationService;
    protected PusherService $pusherService;

    public function __construct()
    {
        $this->activeConversationService = new ActiveConversationService();
        $this->pusherService = new PusherService();
    }

    public function receive(Request $request): JsonResponse
    {
        $status = 400;
        try {
            $request->validate(['custId' => 'required'], ['custId.required' => 'ไม่พบ field custId']);
            $store = $this->activeConversationService->store($request->custId);
            if ($store['status']) {
                $message = 'บันทึกข้อมูลสำเร็จ';
                $status = 200;
                $this->pusherService->triggerPusher('test','มีการรับเรื่อง');
            } else {
                throw new \Exception($store['message']);
            }
        } catch (\Exception $exception) {
            $message = $exception->getMessage();
        }
        return response()->json([
            'message' => $message
        ],$status);
    }

    public function endTalk(Request $request): JsonResponse
    {
        $status = 400;
        try {
            $end = $this->activeConversationService->endTalk($request->custId);
            if ($end['status']) {
                $status = 200;
                $this->pusherService->triggerPusher('test','ตรวจพบการการจบสนทนา');
            }
            $message = $end['message'];
        }catch (\Exception $exception) {
            $message = $exception->getMessage();
        }
        return response()->json([
           'message' => $message
        ],$status);
    }
}
