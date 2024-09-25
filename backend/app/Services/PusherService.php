<?php
namespace App\Services;

use GuzzleHttp\Exception\GuzzleException;
use Pusher\ApiErrorException;
use Pusher\Pusher;
use Pusher\PusherException;

class PusherService{

    protected ResponseService  $response;
    public function __construct(ResponseService $response){
        $this->response = $response;
    }

    public function triggerPusher($custId , $message): array
    {
        try {
            $options = ['cluster' => env('PUSHER_APP_CLUSTER'), 'useTLS' => true];
            $pusher = new Pusher(env('PUSHER_APP_KEY'), env('PUSHER_APP_SECRET'), env('PUSHER_APP_ID'), $options);
            $pusher->trigger('chat.' . $custId, 'my-event', ['message' => $message]);
            $pusher->trigger('notifications', 'my-event', [
                'message' => $message,
            ]);
            $data = $this->response->Res(true,'การแจ้งเตือนสำเร็จ','ไม่พบข้อผิดพลาด');
        }catch (\Exception $e){
            $data = $this->response->Res(false,'การแจ้งเตือนไม่สำเร็จ',$e->getMessage());
        } catch (GuzzleException $e) {
            $data = $this->response->Res(false,'การแจ้งเตือนไม่สำเร็จ',$e->getMessage());
        }
        return $data;
    }
}
