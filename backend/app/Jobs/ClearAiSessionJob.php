<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * แจ้ง AI service (chat-oc-summary) ให้ล้าง session ของลูกค้าคนหนึ่งออกจาก memory ทันทีที่ปิดเคส
 * ("session_id" ในความหมายของ service นี้คือ custId — ดู AiAssistantController::liveSuggest())
 * เรียก host เดียวกับ CHAT_OC_SUMMARY_URL แต่คนละ path (/session/clear แทน /chat-oc-summary)
 *
 * ทำเป็น queued job (ไม่เรียกตรงใน endTalk()) เพราะเรียกทดสอบจริงแล้วถ้า service ต่อไม่ติด
 * Guzzle client กว่าจะ timeout ใช้เวลาเป็นสิบวินาที — ถ้าเรียกแบบ sync จะทำให้ปุ่ม "จบการสนทนา"
 * ค้างรอ response นานผิดปกติ ทั้งที่ปิดเคสจริงสำเร็จไปแล้ว
 */
class ClearAiSessionJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        protected string $custId
    ) {}

    public function handle(): void
    {
        try {
            $configuredUrl = config('services.chat_oc_summary.url');
            if (!$configuredUrl) {
                Log::warning('ClearAiSessionJob: ยังไม่ได้ตั้งค่า CHAT_OC_SUMMARY_URL ข้ามการล้าง session');
                return;
            }

            $parts = parse_url($configuredUrl);
            if (empty($parts['scheme']) || empty($parts['host'])) {
                Log::warning("ClearAiSessionJob: อ่าน host จาก CHAT_OC_SUMMARY_URL ไม่ได้ ({$configuredUrl}) ข้ามการล้าง session");
                return;
            }
            $origin = $parts['scheme'] . '://' . $parts['host'] . (!empty($parts['port']) ? ':' . $parts['port'] : '');
            $url = $origin . '/session/clear';

            $client = new \GuzzleHttp\Client(['timeout' => 10, 'http_errors' => false]);
            $res = $client->request('POST', $url, ['json' => ['session_id' => $this->custId]]);

            $status = $res->getStatusCode();
            if ($status < 200 || $status >= 300) {
                Log::warning("ClearAiSessionJob: session/clear ตอบกลับ HTTP {$status} — " . (string) $res->getBody());
            }
        } catch (\Throwable $e) {
            Log::error('ClearAiSessionJob: เรียก session/clear ไม่สำเร็จ — ' . $e->getMessage());
        }
    }
}
