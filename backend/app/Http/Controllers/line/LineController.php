<?php

namespace App\Http\Controllers\line;

use App\Http\Controllers\Controller;
use App\Models\chatHistory;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Pusher\Pusher;


class LineController extends Controller
{
    public function sendMessage(Request $request): JsonResponse
    {
        $URL = 'https://api.line.me/v2/bot/message/push';
        $data_body = $request->dataBody;
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . env('CHANNEL_ACCESS_TOKEN')
            ])->asJson()->post($URL,
                $data_body
            );

            if ($response->successful()) {
                try {
                    $chatHistory = new chatHistory();
                    $chatHistory->custId = $data_body['to'];
                    $chatHistory->sender = json_encode(auth()->user());
                    $chatHistory->content = $data_body['messages'][0]['text'];
                    $chatHistory->contentType = $data_body['messages'][0]['type'];
                    $chatHistory->save();
                    $options = [
                        'cluster' => env('PUSHER_APP_CLUSTER'),
                        'useTLS' => true
                    ];
                    $pusher = new Pusher(env('PUSHER_APP_KEY'), env('PUSHER_APP_SECRET'), env('PUSHER_APP_ID'), $options);
                    $pusher->trigger('notifications', 'my-event', [
                        'system_send' => true
                    ]);
                }catch (\Exception|GuzzleException $e){
                    return response()->json(['error' => $e->getMessage()], 500);
                }

            }

            return response()->json([
                'message' => $response->successful() ? 'ส่งข้อความสำเร็จ' : 'ไม่สามารถส่งข้อความได้กรุณาติดต่อ admin',
                'data' => $data_body
            ],$response->status());

        }catch (ConnectionException $e){
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
