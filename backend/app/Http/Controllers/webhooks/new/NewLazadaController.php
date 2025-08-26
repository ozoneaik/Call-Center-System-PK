<?php

namespace App\Http\Controllers\webhooks\new;

use App\Http\Controllers\Controller;
use App\Models\BotMenu;
use App\Models\ChatHistory;
use App\Models\Customers;
use App\Models\PlatformAccessTokens;
use App\Services\PusherService;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Lazada\LazopClient;
use Lazada\LazopRequest;
use App\Services\webhooks_new\FilterCase;
use Illuminate\Support\Facades\Cache;

class NewLazadaController extends Controller
{
    protected string $start_log_line = '--------------------------------------------------🌞 เริ่มรับ webhook--------------------------------------------------';
    protected string $end_log_line   = '---------------------------------------------------🌚 สิ้นสุดรับ webhook---------------------------------------------------';

    protected FilterCase $filterCase;
    public function __construct(FilterCase $filterCase)
    {
        $this->filterCase = $filterCase;
    }

    public function webhook(Request $request)
    {
        try {
            $req = $request->all();
            if ($req['message_type'] === 2 && $req['data']['from_account_type'] === 1) {

                // ดักจับ webhook ส่งข้อความมมาซ้ำ
                $check_message_id_same = ChatHistory::query()->where('line_message_id', $req['data']['message_id'])->first();
                if ($check_message_id_same) {
                    Log::info('จับได้ 1 webhook');
                    return response()->json([
                        'message' => 'ตอบกลับ webhook สําเร็จ เป็นข้อความที่เคยส่งมาแล้ว',
                    ]);
                }

                Log::info($this->start_log_line);
                Log::info('รับ webhook จาก Lazada');
                Log::info('รับ webhook สำเร็จเป็น event ส่งข้อความ');
                Log::info(json_encode($req, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

                $session_id = $req['data']['session_id'] ?? null;
                $check_customer_and_get_platform = $this->check_customer_and_get_platform($session_id);
                $customer = $check_customer_and_get_platform['customer'];
                $platform = $check_customer_and_get_platform['platform'];

                $msg_id = $req['data']['message_id'] ?? null;
                $message_req = [
                    'message_id' => $req['data']['message_id'],
                    'content' =>  json_decode($req['data']['content'], true),
                    'template_id' => $req['data']['template_id']
                ];
                $message_formatted = $this->format_message($message_req, $platform);
                $filter_case = $this->filterCase->filterCase($customer, $message_formatted, $platform);
                Log::info(json_encode($filter_case, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                $send_message = $this->pushReplyMessage($filter_case, $msg_id);
            } else {
                return response()->json([
                    'message' => 'รับ webhook สำเร็จแต่ไม่ใช่ event ส่งข้อความ'
                ]);
            }
        } catch (\Exception $e) {
            $message_error = 'เกิดข้อผิดพลาดในการตอบกลับ webhook: ';
            $message_error .= $e->getMessage() . ' | ' . 'ไฟล์ที่: ' . $e->getFile() . ' | ' . 'บรรทัดที่: ' . $e->getLine();
            Log::error('เกิดข้อผิดพลาด ❌ : ' . $e->getMessage());
        }
        Log::info($this->end_log_line);
        return response()->json([
            'message' => 'ตอบกลับ webhook สําเร็จ',
        ]);
    }

    private function check_customer_and_get_platform($session_id)
    {
        $lazada_platform = PlatformAccessTokens::query()->where('platform', 'lazada')->first();
        $check_customer = Customers::query()->where('custId', $session_id)->first();
        if ($check_customer) {
            return [
                'platform' => $lazada_platform,
                'customer' => $check_customer
            ];
        } else {
            $short_id = strtoupper(substr(md5($session_id), 0, 8));

            $new_customer = Customers::query()->create([
                'custId' => $session_id,
                'custName' => "LAZ-{$short_id}",
                'description' => "ติดต่อมาจาก lazada platform",
                'avatar' => null,
                'platformRef' => $lazada_platform->id
            ]);
            return [
                'platform' => $lazada_platform,
                'customer' => $new_customer
            ];
        }
    }

    private function format_message($message_req, $platform)
    {
        $msg_formatted = [];
        switch ($message_req['template_id']) {
            case 1:
                $msg_formatted['content'] = $message_req['content']['txt'];
                $msg_formatted['contentType'] = 'text';
                break;
            case 3:
                $msg_formatted['content'] = $message_req['content']['imgUrl'];
                $msg_formatted['contentType'] = 'image';
                break;
            case 6:
                $msg_formatted['content'] = $this->getMedia($message_req['content']['videoId'], $platform);
                $msg_formatted['contentType'] = 'video';
                break;
            case 10006:
                $msg_formatted['content'] = 'ส่งสินค้าในตะกร้าเข้ามา';
                $msg_formatted['contentType'] = 'text';
                break;
            default:
                $msg_formatted['content'] = 'ส่งอย่างอื่น ไม่รู้';
                $msg_formatted['contentType'] = 'text';
                break;
        }
        $msg_formatted['reply_token'] = 'ไม่มีไรหรอก';
        $msg_formatted['line_quote_token'] = $message_req['message_id'];
        $msg_formatted['line_message_id'] = $message_req['message_id'];
        return $msg_formatted;
    }

    private function getMedia($videoId, $platform)
    {
        try {
            $url = 'https://api.lazada.co.th/rest';

            $c = new LazopClient($url, $platform['laz_app_key'], $platform['laz_app_secret']);
            $request = new LazopRequest('/media/video/get', 'GET');
            $request->addApiParam('videoId', $videoId);
            $response = $c->execute($request, $platform['accessToken']);
            Log::info($response);
            $result = json_decode($response, true);

            return $result['video_url'] ?? null;
        } catch (\Exception $e) {
            return "ไม่สามารถรับ video จากลูกค้าทักเข้ามา กรุณาแจ้ง id นี้ให้แอดมิน ($videoId)";
        }
    }

    public static function pushReplyMessage($filter_case)
    {
        try {
            $filter_case_response = $filter_case['case'] ?? $filter_case;
            if (isset($filter_case_response['send_to_cust']) && !$filter_case_response['send_to_cust']) {
                return [
                    'status' => true,
                    'message' => 'ตอบกลับสำเร็จ'
                ];
            }
            $platformToken = $filter_case_response['platform_access_token'] ?? null;
            $customer      = $filter_case_response['customer'] ?? null;
            $messages      = $filter_case_response['messages'] ?? [];

            if (!$platformToken || empty($platformToken['laz_app_key']) || empty($platformToken['laz_app_secret']) || empty($platformToken['accessToken'])) {
                throw new \Exception("ไม่พบ Lazada credentials ใน platform_access_token");
            }
            $messages_to_send = [];
            switch ($filter_case_response['type_send']) {
                case 'queue':
                    foreach ($messages as $message) {
                        $messages_to_send[] = [
                            'txt' => $message['content'] ?? '',
                            'template_id' => '1'
                        ];
                    }
                    break;
                case 'menu':
                    $menuLines = BotMenu::query()
                        ->where('botTokenId', $platformToken['id'])
                        ->get()
                        ->map(fn($bot) => ($bot->menu_number ?? '-') . '. ' . ($bot->menuName ?? '-'))
                        ->implode("\n");

                    $messages_to_send[] = [
                        'txt' => "เลือกเมนู\n" . ($menuLines ?: '- ยังไม่มีเมนู -'),
                        'template_id' => '1'
                    ];
                    break;
                case 'menu_sended':
                case 'present':
                    $messages_to_send[] = [
                        'txt' => $filter_case_response['messages'][0]['content'] ?? '',
                        'template_id' => '1'
                    ];
                    break;
                case 'normal':
                    foreach ($messages as $message) {
                        $msg_data = [];
                        if ($message['contentType'] === 'text') {
                            $msg_data['txt'] = $message['content'];
                            $msg_data['template_id'] = '1';
                        } elseif ($message['contentType'] === 'image') {
                            $msg_data['img_url'] = $message['content'];
                            $msg_data['template_id'] = '3';
                        } elseif ($message['contentType'] === 'video') {
                            $msg_data['video_url']      = $message['content'];
                            $msg_data['template_id']    = '6';
                            $msg_data['width']          = (string)($message['width'] ?? 720);
                            $msg_data['height']         = (string)($message['height'] ?? 1280);
                            $msg_data['videoDuration']  = (string)($message['videoDuration'] ?? 10);
                        }
                        $messages_to_send[] = $msg_data;
                    }
                    break;
                case 'evaluation':
                    return [
                        'status' => true,
                        'message' => 'รับข้อความในรูปแบบการประเมินแต่ไม่สามารถส่งแบบประเมินได้'
                    ];
                default:
                    $messages_to_send[] = [
                        'txt' => "ระบบไม่รองรับ type_send: " . $filter_case_response['type_send'],
                        'template_id' => '1'
                    ];
                    break;
            }

            $url = 'https://api.lazada.co.th/rest';
            $c = new LazopClient(
                $url,
                $platformToken['laz_app_key'],
                $platformToken['laz_app_secret']
            );

            $sent_messages = [];
            foreach ($messages_to_send as $msg_data) {
                $request = new LazopRequest('/im/message/send');
                $request->addApiParam('session_id', $customer['custId']);
                $request->addApiParam('template_id', $msg_data['template_id']);

                if (!empty($msg_data['txt'])) {
                    $request->addApiParam('txt', $msg_data['txt']);
                }
                if (!empty($msg_data['img_url'])) {
                    $request->addApiParam('img_url', $msg_data['img_url']);
                    $request->addApiParam('width', $msg_data['width'] ?? 720);
                    $request->addApiParam('height', $msg_data['height'] ?? 1280);
                }
                if (!empty($msg_data['video_url'])) {
                    $videoId = self::uploadVideoToLazada($msg_data['video_url'], $platformToken);
                    if (empty($videoId)) {
                        throw new \Exception('อัปโหลดวิดีโอไป Lazada ไม่สำเร็จ (video_id ว่าง)');
                    }
                    $request->addApiParam('template_id', '6');
                    $request->addApiParam('video_id', (string)$videoId);
                    $request->addApiParam('width', (string)($msg_data['width'] ?? '720'));
                    $request->addApiParam('height', (string)($msg_data['height'] ?? '1280'));
                    $request->addApiParam('videoDuration', (string)($msg_data['videoDuration'] ?? '10'));
                }
                $response = $c->execute($request, $platformToken['accessToken']);
                $result = json_decode($response, true);
                if (isset($result['code']) && $result['code'] == '0') {
                    Log::info('ส่งข้อความตอบกลับไปยัง Lazada สำเร็จ', [
                        'response' => $response,
                        'message_data' => $msg_data
                    ]);
                    $sent_messages[] = [
                        'content' => $msg_data['txt'] ?? $msg_data['img_url'] ?? $msg_data['video_url'] ?? '',
                        'contentType' => $msg_data['template_id'] == '1' ? 'text' : ($msg_data['template_id'] == '3' ? 'image' : 'video'),
                        'response' => $result
                    ];
                } else {
                    Log::error('ส่งข้อความตอบกลับไปยัง Lazada ไม่สำเร็จ', [
                        'response' => $response,
                        'message_data' => $msg_data
                    ]);
                    throw new \Exception('ไม่สามารถส่งข้อความตอบกลับไปยัง Lazada ได้: ' . ($result['message'] ?? 'Unknown error'));
                }
            }
            foreach ($sent_messages as $key => $message) {
                $store_chat = new ChatHistory();
                $store_chat->custId = $customer['custId'];
                $store_chat->content = $message['content'];
                $store_chat->contentType = $message['contentType'];
                if ($filter_case_response['type_send'] === 'normal') {
                    $store_chat->sender = json_encode($filter_case_response['employee'] ?? []);
                } else {
                    $store_chat->sender = json_encode($filter_case_response['bot'] ?? ['name' => 'system']);
                }
                $store_chat->conversationRef = $filter_case_response['ac_id'] ?? null;
                // $store_chat->line_message_id = $msg_id;
                $store_chat->line_quote_token = $message['response']['data']['quote_token'] ?? null;
                $store_chat->save();
            }
            $pusherService = new PusherService();
            if ($filter_case_response['type_send'] === 'present') {
                $pusherService->sendNotification($customer['custId'], 'มีการรับเรื่อง');
            } else {
                $pusherService->sendNotification($customer['custId'] ?? '');
            }
            return [
                'status' => true,
                'message' => 'ส่งข้อความสำเร็จ',
                'sent_count' => count($sent_messages)
            ];
        } catch (\Exception $e) {
            Log::error('เกิดข้อผิดพลาดในการส่งข้อความ Lazada: ' . $e->getMessage());
            Log::error('File: ' . $e->getFile() . ' Lazada: ' . $e->getLine());

            return [
                'status' => false,
                'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
            ];
        }
    }

    private static function uploadVideoToLazada(string $videoUrl, PlatformAccessTokens $platformToken, string $title = "Video from Call Center")
    {
        try {
            $url    = 'https://api.lazada.co.th/rest';
            $client = new LazopClient($url, $platformToken->laz_app_key, $platformToken->laz_app_secret);

            // เตรียมไฟล์
            $needCleanup = false;
            if (filter_var($videoUrl, FILTER_VALIDATE_URL)) {
                $localPath = sys_get_temp_dir() . '/' . uniqid('lzd_video_') . '.mp4';
                $in  = @fopen($videoUrl, 'rb');
                $out = @fopen($localPath, 'wb');
                if (!$in || !$out) {
                    throw new \Exception("ไม่สามารถโหลดวิดีโอจาก URL: {$videoUrl}");
                }
                stream_copy_to_stream($in, $out);
                fclose($in);
                fclose($out);
                $needCleanup = true;
            } else {
                $localPath = $videoUrl;
            }
            if (!is_file($localPath)) throw new \Exception("ไม่พบไฟล์วิดีโอที่: {$localPath}");

            $fileSize = filesize($localPath);

            // CREATE
            $createReq = new LazopRequest('/media/video/block/create', 'POST');
            $createReq->addApiParam('fileName', basename($localPath));
            $createReq->addApiParam('fileBytes', (string)$fileSize);
            $createResp   = $client->execute($createReq, $platformToken->accessToken);
            $createResult = json_decode($createResp, true);
            $uploadId = $createResult['upload_id'] ?? ($createResult['data']['upload_id'] ?? null);
            if (!$uploadId) throw new \Exception("สร้าง upload_id ไม่สำเร็จ: {$createResp}");
            Log::info("สร้าง Lazada upload_id สำเร็จ", ['uploadId' => $uploadId, 'createResult' => $createResult]);

            // UPLOAD blocks
            $blockSize  = 5 * 1024 * 1024;
            $blockCount = (int)ceil($fileSize / $blockSize);
            $fh = fopen($localPath, 'rb');
            if ($fh === false) throw new \Exception("ไม่สามารถเปิดไฟล์เพื่ออ่าน: {$localPath}");

            $parts = [];
            for ($blockNo = 0; $blockNo < $blockCount; $blockNo++) {
                $chunk = fread($fh, $blockSize);
                if ($chunk === false) throw new \Exception("อ่านข้อมูลบล็อกไม่สำเร็จ ที่ blockNo={$blockNo}");

                $uploadReq = new LazopRequest('/media/video/block/upload', 'POST');
                $uploadReq->addApiParam('uploadId', $uploadId);
                $uploadReq->addApiParam('blockNo', (string)$blockNo);      // 0-based
                $uploadReq->addApiParam('blockCount', (string)$blockCount);
                $uploadReq->addFileParam('file', $chunk, 'video/mp4');     // ส่งเป็น binary

                $uploadResp   = $client->execute($uploadReq, $platformToken->accessToken);
                $uploadResult = json_decode($uploadResp, true);

                Log::info("-----------uploadResult------------");
                Log::info($uploadResult);
                Log::info("-----------uploadResult------------");

                // Lazada คืน eTag หลายแบบ: รองรับให้ครบ
                $etag = $uploadResult['e_tag']
                    ?? ($uploadResult['data']['eTag'] ?? null)
                    ?? ($uploadResult['data']['etag'] ?? null)
                    ?? ($uploadResult['eTag'] ?? null)
                    ?? ($uploadResult['etag'] ?? null);

                if (!$etag) {
                    throw new \Exception("ไม่มี eTag กลับมาสำหรับ blockNo={$blockNo}: {$uploadResp}");
                }

                // ✅ commit ต้องใช้ 'eTag' (camelCase)
                $parts[] = [
                    'partNumber' => $blockNo + 1,   // 1-based
                    'eTag'       => $etag,          // อย่าใช้ e_tag เด็ดขาด
                ];

                Log::info("อัปโหลดบล็อกสำเร็จ", ['uploadId' => $uploadId, 'blockNo' => $blockNo, 'eTag' => $etag]);
            }
            fclose($fh);

            // กันเคสหลุดลำดับ
            usort($parts, fn($a, $b) => $a['partNumber'] <=> $b['partNumber']);

            // COMMIT
            $commitReq = new LazopRequest('/media/video/block/commit', 'POST');
            $commitReq->addApiParam('uploadId', $uploadId);
            $commitReq->addApiParam('parts', json_encode($parts, JSON_UNESCAPED_UNICODE)); // [{"partNumber":1,"eTag":"..."}]
            $commitReq->addApiParam('title', $title);
            $commitReq->addApiParam('coverUrl', 'https://images.dcpumpkin.com/images/product/500/default.jpg');
            $commitReq->addApiParam('videoUsage', 'pro_main_video');

            Log::info("Commit Payload", ['uploadId' => $uploadId, 'parts' => $parts]);

            $commitResp   = $client->execute($commitReq, $platformToken->accessToken);
            $commitResult = json_decode($commitResp, true);
            Log::info("Commit อัปโหลดวิดีโอ", ['uploadId' => $uploadId, 'resp' => $commitResult]);

            if (($commitResult['success'] ?? null) !== true && ($commitResult['code'] ?? '0') !== '0') {
                throw new \Exception("commit ล้มเหลว: {$commitResp}");
            }

            return $commitResult['video_id'] ?? ($commitResult['data']['video_id'] ?? null);
        } catch (\Throwable $e) {
            Log::error("Upload Video To Lazada Failed: " . $e->getMessage());
            return null;
        } finally {
            if (!empty($needCleanup) && !empty($localPath) && is_file($localPath)) @unlink($localPath);
        }
    }
}
