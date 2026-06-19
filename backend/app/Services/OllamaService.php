<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OllamaService
{
    private string $baseUrl;
    private string $model;

    public function __construct()
    {
        $this->baseUrl = rtrim(env('OLLAMA_URL', 'http://localhost:11434'), '/');
        $this->model   = env('OLLAMA_MODEL', 'llama3.2');
    }

    public function analyzeChat(array $chatData): ?array
    {
        if (empty($chatData)) return null;

        $conversation = $this->formatConversation($chatData);

        $prompt = <<<PROMPT
[ภาษา: ภาษาไทยเท่านั้น — ห้ามใช้ภาษาอังกฤษในค่า topic และ answer]

วิเคราะห์บทสนทนา customer service ด้านล่าง แล้วตอบเป็น JSON เท่านั้น ห้ามเพิ่มข้อความอื่นนอกจาก JSON

บทสนทนา:
{$conversation}

ตอบในรูปแบบ JSON ต่อไปนี้เท่านั้น (ค่าทุกช่องต้องเป็นภาษาไทย):
{"topic": "สรุปสั้นๆ 1 ประโยคว่าลูกค้าต้องการอะไร (ภาษาไทย)", "answer": "คำตอบที่ดีที่สุดสำหรับปัญหาของลูกค้า (ภาษาไทย)"}

ตัวอย่าง:
{"topic": "ลูกค้าสอบถามราคาสินค้าและวิธีการสั่งซื้อ", "answer": "สามารถดูราคาและสั่งซื้อได้ที่เว็บไซต์หรือติดต่อเจ้าหน้าที่โดยตรง"}

กรุณาตอบเฉพาะ JSON เท่านั้น ห้ามมีข้อความอื่น ห้ามใช้ภาษาอังกฤษในค่า topic และ answer
PROMPT;

        try {
            $response = Http::timeout(120)->post("{$this->baseUrl}/api/chat", [
                'model'  => $this->model,
                'stream' => false,
                'format' => 'json',
                'messages' => [
                    [
                        'role'    => 'system',
                        'content' => 'คุณคือผู้ช่วยสรุปข้อมูล Knowledge Base ภาษาไทยสำหรับทีม Customer Service บริษัทในประเทศไทย กฎเหล็ก: (1) ตอบเป็นภาษาไทยเท่านั้น ห้ามใช้ภาษาอังกฤษในเนื้อหาคำตอบ (2) ตอบเฉพาะ JSON format เท่านั้น (3) ห้ามอธิบายหรือเพิ่มข้อความนอกจาก JSON',
                    ],
                    [
                        'role'    => 'user',
                        'content' => $prompt,
                    ],
                ],
            ]);

            if (!$response->successful()) {
                Log::warning("OllamaService: HTTP {$response->status()} — {$response->body()}");
                return null;
            }

            $content = $response->json('message.content');
            if (!$content) return null;

            $result = json_decode($content, true);
            if (!is_array($result) || empty($result['topic']) || empty($result['answer'])) {
                Log::warning("OllamaService: JSON ไม่ถูกต้อง — {$content}");
                return null;
            }

            return [
                'topic'  => trim($result['topic']),
                'answer' => trim($result['answer']),
            ];
        } catch (\Throwable $e) {
            Log::error("OllamaService error: " . $e->getMessage());
            return null;
        }
    }

    private function formatConversation(array $chatData): string
    {
        $lines = [];
        foreach ($chatData as $msg) {
            $role    = match ($msg['role'] ?? '') {
                'agent'    => 'เจ้าหน้าที่',
                'bot'      => 'BOT',
                'customer' => 'ลูกค้า',
                default    => 'unknown',
            };
            $name    = $msg['sender_name'] ?? '';
            $type    = $msg['contentType'] ?? 'text';
            $content = ($type === 'text') ? ($msg['content'] ?? '') : "[{$type}]";

            // ตัดข้อความยาวเกิน 500 ตัวอักษร
            if (mb_strlen($content) > 500) {
                $content = mb_substr($content, 0, 500) . '...';
            }

            $lines[] = "[{$role} ({$name})]: {$content}";
        }
        return implode("\n", $lines);
    }
}
