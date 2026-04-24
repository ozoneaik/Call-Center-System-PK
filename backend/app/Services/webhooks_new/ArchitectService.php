<?php

namespace App\Services\webhooks_new;

use App\Models\ActiveConversations;
use App\Models\ChatHistory;
use App\Models\Rates;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class ArchitectService
{
    /**
     * ใช้สำหรับเปิด-ปิด ฟังก์ชันงานสถาปนิก
     * เปลี่ยนเป็น false เมื่อจบงานหรือไม่ต้องการใช้งานแล้ว
     */
    public function isActive(): bool
    {
        return false;
    }

    /**
     * ID ของห้องสถาปนิก
     */
    public function getRoomId(): string
    {
        return 'ROOM115';
    }

    /**
     * ข้อความแนะนำที่จะส่งหลังเมนูหลัก
     */
    public function getInstructionMessage(): ?array
    {
        if (!$this->isActive()) return null;

        return [
            'type' => 'text',
            'text' => "หากคุณลูกค้าต้องการติดต่อสอบถามเกี่ยวกับงานสถาปนิก กรุณาพิมพ์ \"งานสถาปนิก\" หรือเลข \"5\" \nเพื่อติดต่อขอรับข้อมูลเกี่ยวกับงานสถาปนิก เช่น ขอใบกำกับภาษี, ขอสำเนาใบเสร็จ"
        ];
    }

    /**
     * ตรวจสอบ Keyword ที่เกี่ยวข้องกับงานสถาปนิก
     */
    public function handleKeywordDetection($message)
    {
        if (!$this->isActive() || ($message['contentType'] ?? '') !== 'text') {
            return null;
        }

        $content = trim($message['content'] ?? '');

        if (
            str_contains($content, 'งานสถาปนิก') || str_contains($content, 'สถาปนิก') ||
            str_contains($content, 'สถาปนิค') || str_contains($content, 'งานสถาปนิค') ||
            $content === '5'
        ) {
            return 'MAIN_ARCHITECT';
        }

        if (
            str_contains($content, 'ใบกำกับภาษี') || str_contains($content, 'ใบกำกับ') ||
            str_contains($content, 'ภาษี') || str_contains($content, 'ใบภาษี') ||
            $content === '6'
        ) {
            return 'TAX_INVOICE_REQUEST';
        }

        if (
            str_contains($content, 'สำเนาใบเสร็จ') || str_contains($content, 'ใบเสร็จ') ||
            str_contains($content, 'สำเนา') ||
            $content === '7'
        ) {
            return 'RECEIPT_COPY_REQUEST';
        }

        // จับตัวเลข 12 หลัก
        if (preg_match('/^\d{12}$/', $content)) {
            return 'PROCESS_12_DIGIT_RECEIPT';
        }

        return null;
    }

    /**
     * สร้างโครงสร้างข้อความตอบกลับ
     */
    public function getResponse($type, $customer, $ac_id, $platformAccessToken, $reply_token, $bot, $messageContent = null)
    {
        $messages = [];

        if ($type === 'MAIN_ARCHITECT') {
            $messages = [
                ['content' => "กรุณาพิมพ์ \"ใบกำกับภาษี\" หรือเลข \"6\" เพื่อติดต่อขอใบกำกับภาษี", 'contentType' => 'text'],
                ['content' => "กรุณาพิมพ์ \"สำเนาใบเสร็จ\" หรือเลข \"7\" เพื่อติดต่อขอสำเนาใบเสร็จ", 'contentType' => 'text']
            ];
        } elseif ($type === 'TAX_INVOICE_REQUEST' || $type === 'RECEIPT_COPY_REQUEST') {
            // ไม่ว่าขอใบกำกับ หรือ สำเนา ก็ให้ส่งเลข 12 หลักมาก่อน
            $messages = [
                ['content' => "กรุณากรอกเลขที่ ใบเสร็จรับเงิน 12 หลัก", 'contentType' => 'text']
            ];
        } elseif ($type === 'PROCESS_12_DIGIT_RECEIPT') {
            // เมื่อลูกค้าส่งเลข 12 หลักมา เราจะไปดึง API 1 ครั้ง แล้วคืนค่าทั้งลิงก์ภาษี และสลิป PDF (ถ้ามี)
            $receiptNo = trim($messageContent);
            $receiptData = $this->fetchReceiptFromApi($receiptNo);

            if ($receiptData) {
                // เช็คว่าลูกค้าขออะไรล่าสุด โดยดึงประวัติแชทล่าสุดของลูกค้า (ที่ไม่ใช่เลข 12 หลัก)
                $previousRequestType = $this->getPreviousRequestType($customer['custId']);

                if ($previousRequestType === 'TAX_INVOICE') {
                    // กรณีขอใบกำกับภาษี ส่งเฉพาะลิงก์
                    $taxNo = $receiptData['tax_invoice']['taxno'] ?? null;
                    if (!empty($taxNo)) {
                        $taxUrl = "https://asa-expo.pumpkin.tools/tax/{$taxNo}";
                        $messages[] = [
                            'content' => "สามารถดำเนินการขอใบกำกับภาษี หรือ ดาวน์โหลด ได้ที่ลิงก์นี้ครับ\n" . $taxUrl,
                            'contentType' => 'text'
                        ];
                    } else {
                        $messages[] = [
                            'content' => "ไม่พบข้อมูลใบกำกับภาษีสำหรับใบเสร็จเลขที่ {$receiptNo}",
                            'contentType' => 'text'
                        ];
                    }
                } elseif ($previousRequestType === 'RECEIPT_COPY') {
                    $pdfUrl = $this->generateReceiptPdf($receiptData);
                    if ($pdfUrl) {
                        $messages[] = [
                            'content'     => $pdfUrl,
                            'contentType' => 'file',
                            'file_label'  => 'receipt_copy',
                        ];
                    } else {
                        $messages[] = [
                            'content'     => "ไม่สามารถสร้างสำเนาใบเสร็จได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
                            'contentType' => 'text'
                        ];
                    }
                } else {
                    // ถ้าไม่แน่ใจ (เช่น พิมพ์ตัวเลขมาดื้อๆ) ให้ส่งไปทั้งสองอย่างเหมือนเดิมเพื่อความชัวร์
                    $taxNo = $receiptData['tax_invoice']['taxno'] ?? null;
                    if (!empty($taxNo)) {
                        $taxUrl = "https://asa-expo.pumpkin.tools/tax/{$taxNo}";
                        $messages[] = [
                            'content' => "ใบกำกับภาษี: " . $taxUrl,
                            'contentType' => 'text'
                        ];
                    }
                    $pdfUrl = $this->generateReceiptPdf($receiptData);
                    if ($pdfUrl) {
                        $messages[] = [
                            'content' => $pdfUrl,
                            'contentType' => 'file'
                        ];
                    }
                }

                // ดัก Error กรณีไม่มี message จะส่ง
                if (empty($messages)) {
                    $messages = [
                        ['content' => "ไม่พบข้อมูลที่สามารถดำเนินการได้สำหรับใบเสร็จเลขที่ {$receiptNo}", 'contentType' => 'text']
                    ];
                }
            } else {
                $messages = [
                    ['content' => "ไม่พบข้อมูลใบเสร็จเลขที่ {$receiptNo} หรือระบบขัดข้อง กรุณาลองตรวจสอบใหม่อีกครั้งครับ", 'contentType' => 'text']
                ];
            }
        }

        return [
            'status' => true,
            'send_to_cust' => true,
            'type_send' => 'normal',
            'type_message' => 'reply',
            'messages' => $messages,
            'customer' => $customer,
            'ac_id' => $ac_id,
            'platform_access_token' => $platformAccessToken,
            'reply_token' => $reply_token,
            'bot' => $bot
        ];
    }

    /**
     * ดึงข้อความล่าสุดของลูกค้าก่อนหน้าที่จะพิมพ์เลข 12 หลัก
     * เพื่อเช็คว่าลูกค้าตั้งใจขออะไร
     */
    private function getPreviousRequestType($custId)
    {
        $recentChats = ChatHistory::where('custId', $custId)
            ->where('contentType', 'text')
            ->where('sender', 'LIKE', '%"custId"%')
            ->orderBy('id', 'desc')
            ->take(10)
            ->get();

        // เพิ่ม log ดู raw data
        Log::channel('webhook_main')->info("getPreviousRequestType raw chats for {$custId}", [
            'chats' => $recentChats->map(fn($c) => [
                'id'      => $c->id,
                'content' => $c->content,
                'sender'  => $c->sender,
            ])->toArray()
        ]);

        foreach ($recentChats as $chat) {
            $text = trim($chat->content);

            if (preg_match('/^\d{12}$/', $text)) {
                continue;
            }

            if (str_contains($text, 'ใบกำกับภาษี') || str_contains($text, 'ใบกำกับ') || str_contains($text, 'ภาษี') || str_contains($text, '6')) {
                Log::channel('webhook_main')->info("ตรวจพบว่าลูกค้า {$custId} เคยขอ: TAX_INVOICE (matched: {$text})");
                return 'TAX_INVOICE';
            }

            if (str_contains($text, 'สำเนาใบเสร็จ') || str_contains($text, 'ใบเสร็จ') || str_contains($text, 'สำเนา') || str_contains($text, '7')) {
                Log::channel('webhook_main')->info("ตรวจพบว่าลูกค้า {$custId} เคยขอ: RECEIPT_COPY (matched: {$text})");
                return 'RECEIPT_COPY';
            }
        }

        Log::channel('webhook_main')->warning("หาเจตนาของลูกค้าไม่เจอสำหรับ {$custId} - คืนค่า UNKNOWN");
        return 'UNKNOWN';
    }

    /**
     * ดึงข้อมูล JSON จาก API ด้วยเลข 12 หลัก
     */
    private function fetchReceiptFromApi($receiptNo)
    {
        try {
            $response = Http::timeout(15)->get("https://asa-expo.pumpkin.tools/api/receipt/{$receiptNo}");

            if ($response->successful()) {
                $data = $response->json();
                return $data['receipt'] ?? null;
            }
            return null;
        } catch (\Exception $e) {
            Log::channel('webhook_main')->error("ไม่สามารถเชื่อมต่อ API ใบเสร็จ: " . $e->getMessage());
            return null;
        }
    }

    /**
     * สร้าง PDF จากข้อมูล JSON ที่ส่งเข้ามา
     */
    private function generateReceiptPdf($receipt)
    {
        try {
            // โหลด View
            $html = view('pdfs.receipt', ['receipt' => $receipt])->render();

            // สร้าง PDF (ความกว้าง 226.77 pt)
            $pdf = Pdf::loadHTML($html)->setPaper([0, 0, 226.77, 1500]);

            $receiptNo = $receipt['token'] ?? 'unknown';
            $fileName = "receipts/architect_{$receiptNo}_" . time() . ".pdf";

            // อัปโหลด S3
            Storage::disk('s3')->put($fileName, $pdf->output(), [
                'ContentType' => 'application/pdf',
            ]);

            // return Temporary URL (หรือ url ตรงๆ ถ้าตั้ง public ไว้)
            return Storage::disk('s3')->url($fileName);
        } catch (\Exception $e) {
            Log::channel('webhook_main')->error("สร้าง PDF ใบเสร็จล้มเหลว: " . $e->getMessage());
            return null;
        }
    }

    /**
     * ชื่อและ label สำหรับ file template ของสำเนาใบเสร็จ
     */
    public function getReceiptFileLabel(): array
    {
        return [
            'altText'   => 'สำเนาใบเสร็จรับเงิน',
            'title'     => 'สำเนาใบเสร็จรับเงิน',
            'text'      => 'ไฟล์สำเนาใบเสร็จ.pdf',
            'label'     => 'ดูสำเนาใบเสร็จ',
        ];
    }

    /**
     * ชื่อและ label สำหรับ file template ทั่วไป
     */
    public function getDefaultFileLabel(): array
    {
        return [
            'altText'   => 'ส่งไฟล์',
            'title'     => 'ไฟล์เอกสาร',
            'text'      => 'ไฟล์.pdf',
            'label'     => 'ดูไฟล์',
        ];
    }

    public function isAllowedPlatform(array $platform): bool
    {
        return ($platform['description'] ?? '') === 'pumpkintools';
    }
}
