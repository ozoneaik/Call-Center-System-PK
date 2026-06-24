<?php

namespace App\Http\Controllers\Chats\Line;

use App\Http\Controllers\Controller;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\File;

class RetryMediaController extends Controller
{
    /**
     * ดึง media URL จาก LINE API ใหม่อีกครั้ง
     * รับ: chat_history_id, line_message_id
     * ส่งคืน: URL ที่อัปโหลดขึ้น S3 แล้ว
     */
    public function retryMedia(Request $request): JsonResponse
    {
        $request->validate([
            'chat_history_id' => 'required|integer',
            'line_message_id' => 'required|string',
        ]);

        try {
            $chatHistory = ChatHistory::find($request->chat_history_id);
            if (!$chatHistory) {
                return response()->json([
                    'message' => 'ไม่พบข้อมูลข้อความ',
                    'detail'  => 'chat_history_id ไม่ถูกต้อง',
                ], 404);
            }

            // ตรวจว่า content ยังเป็น error อยู่ (ถ้าดึงสำเร็จแล้ว ก็ไม่ต้องทำซ้ำ)
            $errorKeyword = 'ไม่สามารถดึง URL ของสื่อได้';
            if ($chatHistory->content !== $errorKeyword) {
                return response()->json([
                    'message' => 'ข้อความนี้มี URL อยู่แล้ว',
                    'url'     => $chatHistory->content,
                ], 200);
            }

            // หา Access Token ของ platform จาก custId
            $customer = Customers::where('custId', $chatHistory->custId)->first();
            if (!$customer) {
                return response()->json([
                    'message' => 'ไม่พบข้อมูลลูกค้า',
                ], 404);
            }

            $platform = PlatformAccessTokens::find($customer->platformRef);
            if (!$platform || !$platform->accessToken) {
                return response()->json([
                    'message' => 'ไม่พบ Access Token ของ platform',
                ], 404);
            }

            $newUrl = $this->getUrlMedia($request->line_message_id, $platform->accessToken);

            if ($newUrl === $errorKeyword) {
                return response()->json([
                    'message' => 'ยังไม่สามารถดึงสื่อได้',
                    'detail'  => 'LINE API ยังไม่ตอบกลับ หรือสื่อหมดอายุแล้ว',
                ], 422);
            }

            // อัปเดต content ใหม่ใน database
            $chatHistory->content = $newUrl;
            $chatHistory->save();

            Log::info('Retry media สำเร็จ', [
                'chat_history_id' => $request->chat_history_id,
                'line_message_id' => $request->line_message_id,
                'new_url'         => $newUrl,
            ]);

            return response()->json([
                'message' => 'ดึงสื่อสำเร็จ',
                'url'     => $newUrl,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Retry media error: ' . $e->getMessage());
            return response()->json([
                'message' => 'เกิดข้อผิดพลาด',
                'detail'  => $e->getMessage(),
            ], 500);
        }
    }

    private function getUrlMedia(string $mediaId, string $accessToken): string
    {
        $full_url  = '';
        $endpoint  = "https://api-data.line.me/v2/bot/message/$mediaId/content";
        $errorText = 'ไม่สามารถดึง URL ของสื่อได้';

        // 1. กำหนดตำแหน่งไฟล์ชั่วคราวบนเซิร์ฟเวอร์ (บันทึกไว้ใน storage/app/)
        $tempPath = storage_path("app/temp_{$mediaId}");

        try {
            // 2. ดาวน์โหลดไฟล์จาก LINE และเขียนลงดิสก์โดยตรงด้วย sink (ไม่โหลดเข้า RAM)
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
            ])
                ->timeout(120)  // ตั้งเวลาเผื่อให้โหลดไฟล์ขนาดใหญ่ได้เสร็จสิ้น
                ->sink($tempPath)
                ->get($endpoint);

            if ($response->successful() && file_exists($tempPath)) {
                $contentType = $response->header('Content-Type');

                // จับคู่ Extension จาก Content-Type (ตาม Logic เดิมของคุณ)
                $extension = match ($contentType) {
                    'image/jpeg' => '.jpg',
                    'image/png' => '.png',
                    'image/gif' => '.gif',
                    'video/mp4' => '.mp4',
                    'video/webm' => '.webm',
                    'video/ogg' => '.ogg',
                    'video/avi' => '.avi',
                    'video/mov' => '.mov',
                    'audio/x-m4a' => '.m4a',
                    'application/pdf' => '.pdf',
                    'application/zip' => '.zip',
                    'application/msword' => '.doc',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => '.docx',
                    'application/vnd.ms-excel' => '.xls',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => '.xlsx',
                    'application/vnd.ms-powerpoint' => '.ppt',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation' => '.pptx',
                    default => '.bin',
                };

                $mediaPath = $mediaId . $extension;

                // 3. อัปโหลดจากไฟล์ชั่วคราวขึ้น S3 แบบ Stream (ประหยัดหน่วยความจำ)
                Storage::disk('s3')->putFileAs('/', new \Illuminate\Http\File($tempPath), $mediaPath, [
                    'visibility' => 'private',
                    'ContentType' => $contentType,
                ]);

                // 4. ลบไฟล์ชั่วคราวออกจากเซิร์ฟเวอร์ทันทีเมื่ออัปโหลดเสร็จสิ้น
                if (file_exists($tempPath)) {
                    unlink($tempPath);
                }

                $full_url = Storage::disk('s3')->url($mediaPath);
            } else {
                // หากยิงไป LINE ไม่สำเร็จ ให้เคลียร์ไฟล์ชั่วคราวทิ้ง (ถ้ามีเศษไฟล์ค้างอยู่)
                if (file_exists($tempPath)) {
                    unlink($tempPath);
                }

                $statusCode = $response->status();
                $errorBody = $response->body();
                Log::error('LINE Media API Error (retry stream)', [
                    'status' => $statusCode,
                    'body' => $errorBody,
                    'mediaId' => $mediaId,
                ]);
                $full_url = $errorText;
            }
        } catch (\Exception $e) {
            // หากเกิดข้อผิดพลาดระหว่างทาง (Exception) ให้ลบไฟล์ชั่วคราวทิ้งเพื่อป้องกันพื้นที่เต็ม
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }
            Log::error('getUrlMedia exception (retry stream): ' . $e->getMessage());
            $full_url = $errorText;
        }

        return $full_url;
    }
}