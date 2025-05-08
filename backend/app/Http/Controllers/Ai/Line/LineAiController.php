<?php

namespace App\Http\Controllers\Ai\Line;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LineAiController extends Controller
{
    public function index(Request $request)
    {
        $GEMINI_API_KEY = 'AIzaSyD7vb6DKuFCq36eBMFjWArTdu1HXNofmSg';
        $LINE_CHANNEL_ACCESS_TOKEN = 'VM0CDgaGQJq3fVRHfWH1aSsLwcj3tsy3DEWHJOkoKG0TzCFW7ZjRBF4lUz+qPP5eELzEEnl+S8JPwztI8/iwjOkaIlDOw93aq+Rv2NFDoW0/X6aYLbhdiEWVQe6L3ndyZTnZKn9gi+0hy8pWfbAyEgdB04t89/1O/w1cDnyilFU=';
        $events = $request->events;
        Log::info('LineAiController', [
            'events' => json_encode($events, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        ]);
        try {
            if (count($events) !== 0) {
                foreach ($events as $key => $event) {
                    if ($event['type'] === 'message') {
                        $message = $event['message'];
                        if ($message['type'] === 'text') {
                            $content = $message['text'];
                            $replyToken = $event['replyToken'];
                            $sendGemini = $this->getGeminiResponse($content, $GEMINI_API_KEY);
                            // $sendGemini = 'test';
                            $sendLine = $this->sendMessage($replyToken, $LINE_CHANNEL_ACCESS_TOKEN, $sendGemini);
                            Log::info('here🤖🤖');
                            !$sendLine ?? throw new \Exception('Error send message Line API');
                            Log::info('here🤖🤖');
                        } else throw new \Exception('Invalid message type');
                    } else throw new \Exception('Invalid event type');
                }
            } else throw new \Exception('Invalid event type');
        } catch (\Exception $e) {
            Log::error('LineAiController', [
                'error' => $e->getMessage(),
            ]);
        }
        return response()->json([], 200);
    }

    private function getGeminiResponse($content, $GEMINI_API_KEY)
    {
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=';
        $full_url = $url . $GEMINI_API_KEY;
        $headers = ['Content-Type' => 'application/json'];
        // ใช้คำตลก แอบอยอดมุขเสี่ยวๆนิดหน่อย
        // พูดจาแรงๆ เหน็บแนม เหมือนจะดีแต่ก็ไม่
        $prefix = 'คุณคือบอทที่ให้คำปรึกษาเฉพาะเรื่องความรักเท่านั้น พฤติกรรมของคุณคือ พูดจาแรงๆ เหน็บแนม เหมือนจะดีแต่ก็ไม่ หากฉันถามเรื่องอื่นที่ไม่เกี่ยวกับความรัก ให้ตอบว่า'.'ฉันเป็นบอทที่ให้ปรึกษาเกี่ยวกับความรักครับ ขอไม่ออกความเห็นในเรื่องนี้ครับ🙂';
        $body = [
            'contents' => [
                [
                    "role" => "user",
                    "parts" => [
                        [
                            'text' => $prefix . "\n\n คำถาม : ".$content . "ขอคำตอบที่สั้นๆและเข้าใจง่ายที่สุด พร้อมใส่ emoji ที่เกี่ยวข้องด้วย",
                        ]
                    ]
                ]
            ]
        ];
        $response = Http::withHeaders($headers)->post($full_url, $body);
        if ($response->successful()) {
            $data = $response->json();
            if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                return $data['candidates'][0]['content']['parts'][0]['text'];
            } else return 'ไม่สามารถติดต่อได้ในขณะนี้ ไม่พบ text';
        } else return 'ไม่สามารถติดต่อได้ในขณะนี้ Gemini API';
    }

    private function sendMessage($replyToken, $LINE_CHANNEL_ACCESS_TOKEN, $message = 'ไม่สามารถติดต่อได้ในขณะนี้')
    {
        $url = 'https://api.line.me/v2/bot/message/reply';
        $headers = [
            'Content-Type' => 'application/json',
            'Authorization' => "Bearer $LINE_CHANNEL_ACCESS_TOKEN",
        ];
        $body = ['replyToken' => $replyToken, 'messages' => [['type' => 'text', 'text' => 'Gemini🤖 : '.$message]]];
        $response = Http::withHeaders($headers)->post($url, $body);
        if ($response->successful()) {
            Log::info('Line Success ✅✅');
            return true;
        } else {
            $response = $response->json();
            Log::info('Line Error ❌❌', [
                'error' => $response,
            ]);
            return false;
        }
    }
}
