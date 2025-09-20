<?php

namespace App\Http\Controllers\webhooks\new;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShopeeLiveController extends Controller
{
    //
    private string $host = "https://partner.shopeemobile.com";

    private function generateSign($partnerId, $partnerKey, $path, $timestamp, $accessToken, $userId)
    {
        $baseString = $partnerId . $path . $timestamp . $accessToken . $userId;
        return hash_hmac('sha256', $baseString, $partnerKey);
    }

    public function shopeeCreateLiveSession(Request $req)
    {
        $partnerId   = $req->input('partner_id');
        $partnerKey  = trim($req->input('partner_key'));
        $userId      = (int)$req->input('user_id');  // ✅ ต้องใช้ user_id
        $accessToken = $req->input('access_token');

        if (!$partnerId || !$partnerKey || !$userId || !$accessToken) {
            return response()->json(
                ['error' => 'missing required params'],
                422,
                [],
                JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
            );
        }

        $timestamp = time();
        $host      = "https://partner.shopeemobile.com";
        $path      = "/api/v2/livestream/create_session";

        // ✅ base string ต้องใช้ user_id
        $baseString = $partnerId . $path . $timestamp . $accessToken . $userId;
        $sign       = hash_hmac('sha256', $baseString, $partnerKey);

        $url = "{$host}{$path}?partner_id={$partnerId}&timestamp={$timestamp}&sign={$sign}&access_token={$accessToken}&user_id={$userId}";

        // ✅ Shopee ต้องใช้ cover_image_url (ไม่ใช่ cover_img)
        $body = [
            "title"            => $req->input("title", "Flash Sale 10.10"),
            "cover_image_url"  => $req->input("cover_image_url", "https://via.placeholder.com/640x360.png"),
            "description"      => $req->input("description", "Live test created from Laravel"),
            "is_test"          => (bool) $req->input("is_test", false)
        ];

        $resp    = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post($url, $body);

        $rawBody = $resp->body();
        $json    = json_decode($rawBody, true);

        Log::channel('webhook_shopee_new')->info(
            "📡 Shopee Create Live Session Response\n" .
                json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );

        return response()->json($json, $resp->status(), [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    public function shopeeStartLiveSession(Request $req)
    {
        $partnerId   = $req->input('partner_id');
        $partnerKey  = trim($req->input('partner_key'));
        $userId      = (int)$req->input('user_id');
        $accessToken = $req->input('access_token');
        $sessionId   = (int)$req->input('session_id');
        $domainId    = (int)$req->input('domain_id', 1); // TH = 1

        if (!$partnerId || !$partnerKey || !$userId || !$accessToken || !$sessionId) {
            return response()->json(['error' => 'missing required params'], 422);
        }

        $timestamp = time();
        $path      = "/api/v2/livestream/start_session";
        $sign      = $this->generateSign($partnerId, $partnerKey, $path, $timestamp, $accessToken, $userId);

        $url = "{$this->host}{$path}?partner_id={$partnerId}&timestamp={$timestamp}&sign={$sign}&access_token={$accessToken}&user_id={$userId}";

        $body = [
            "session_id" => $sessionId,
            "domain_id"  => $domainId
        ];

        $resp = Http::withHeaders(['Content-Type' => 'application/json'])->post($url, $body);
        $json = json_decode($resp->body(), true);

        Log::channel('webhook_shopee_new')->info("🎬 Shopee Start Live Session Response\n" . json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return response()->json($json, $resp->status(), [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    public function shopeeGetSessionDetail(Request $req)
    {
        $partnerId   = $req->input('partner_id');
        $partnerKey  = trim($req->input('partner_key'));
        $userId      = (int)$req->input('user_id');
        $accessToken = $req->input('access_token');
        $sessionId   = (int)$req->input('session_id');

        if (!$partnerId || !$partnerKey || !$userId || !$accessToken || !$sessionId) {
            return response()->json(['error' => 'missing required params'], 422);
        }

        $timestamp = time();
        $path      = "/api/v2/livestream/get_session_detail";
        $sign      = $this->generateSign($partnerId, $partnerKey, $path, $timestamp, $accessToken, $userId);

        // ✅ ใช้ GET + query params
        $url = "{$this->host}{$path}?" . http_build_query([
            "partner_id"   => $partnerId,
            "timestamp"    => $timestamp,
            "sign"         => $sign,
            "access_token" => $accessToken,
            "user_id"      => $userId,
            "session_id"   => $sessionId,
        ]);

        $resp = Http::withHeaders(['Content-Type' => 'application/json'])->get($url);

        $rawBody = $resp->body();
        $json    = json_decode($rawBody, true);

        Log::channel('webhook_shopee_new')->info("ℹ️ Shopee Get Session Detail RAW\n" . $rawBody);
        Log::channel('webhook_shopee_new')->info("ℹ️ Shopee Get Session Detail Parsed\n" . json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return response()->json($json, $resp->status(), [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    public function shopeeEndLiveSession(Request $req)
    {
        $partnerId   = $req->input('partner_id');
        $partnerKey  = trim($req->input('partner_key'));
        $userId      = (int)$req->input('user_id');
        $accessToken = $req->input('access_token');
        $sessionId   = (int)$req->input('session_id');

        if (!$partnerId || !$partnerKey || !$userId || !$accessToken || !$sessionId) {
            return response()->json(['error' => 'missing required params'], 422);
        }

        // ✅ เช็คสถานะ session ก่อน end
        $detailResp = $this->shopeeGetSessionDetail(new Request([
            'partner_id'   => $partnerId,
            'partner_key'  => $partnerKey,
            'user_id'      => $userId,
            'access_token' => $accessToken,
            'session_id'   => $sessionId
        ]));

        $detail = $detailResp->getData(true);

        // ✅ status = 1 (ongoing) เท่านั้นถึง end ได้
        if (!isset($detail['response']['status']) || $detail['response']['status'] != 1) {
            return response()->json(['error' => 'Session is not ongoing, cannot end.'], 400);
        }

        $timestamp = time();
        $path      = "/api/v2/livestream/end_session";
        $sign      = $this->generateSign($partnerId, $partnerKey, $path, $timestamp, $accessToken, $userId);

        $url = "{$this->host}{$path}?partner_id={$partnerId}&timestamp={$timestamp}&sign={$sign}&access_token={$accessToken}&user_id={$userId}";

        $body = ["session_id" => $sessionId];

        $resp = Http::withHeaders(['Content-Type' => 'application/json'])->post($url, $body);
        $json = json_decode($resp->body(), true);

        Log::channel('webhook_shopee_new')->info("🛑 Shopee End Live Session Response\n" . json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return response()->json($json, $resp->status(), [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    public function shopeeAddItemList(Request $req)
    {
        $partnerId   = $req->input('partner_id');
        $partnerKey  = trim($req->input('partner_key'));
        $userId      = (int) $req->input('user_id');
        $accessToken = $req->input('access_token');
        $sessionId   = (int) $req->input('session_id');
        $itemList    = $req->input('item_list'); // array ของ item_id + shop_id

        if (!$partnerId || !$partnerKey || !$userId || !$accessToken || !$sessionId || empty($itemList)) {
            return response()->json(['error' => 'missing required params'], 422);
        }

        $timestamp = time();
        $path      = "/api/v2/livestream/add_item_list";
        $sign      = $this->generateSign($partnerId, $partnerKey, $path, $timestamp, $accessToken, $userId);

        $url = "{$this->host}{$path}?partner_id={$partnerId}&timestamp={$timestamp}&sign={$sign}&access_token={$accessToken}&user_id={$userId}";

        // ✅ request body
        $body = [
            "session_id" => $sessionId,
            "item_list"  => $itemList
        ];

        $resp = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post($url, $body);

        $json = json_decode($resp->body(), true);

        // ✅ log pretty
        Log::channel('webhook_shopee_new')->info(
            "🛒 Shopee Add Item List Response\n" .
                json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );

        return response()->json($json, $resp->status(), [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    public function shopeeGetItemList(Request $req)
    {
        $partnerId   = $req->input('partner_id');
        $partnerKey  = trim($req->input('partner_key'));
        $userId      = (int) $req->input('user_id');
        $accessToken = $req->input('access_token');
        $sessionId   = (int) $req->input('session_id');
        $offset      = (int) $req->input('offset', 0);
        $pageSize    = (int) $req->input('page_size', 10);

        if (!$partnerId || !$partnerKey || !$userId || !$accessToken || !$sessionId) {
            return response()->json(['error' => 'missing required params'], 422);
        }

        $timestamp = time();
        $path      = "/api/v2/livestream/get_item_list";
        $sign      = $this->generateSign($partnerId, $partnerKey, $path, $timestamp, $accessToken, $userId);

        // ✅ GET request ต้องใส่ param ทั้งหมดใน URL
        $query = http_build_query([
            'partner_id'  => $partnerId,
            'timestamp'   => $timestamp,
            'sign'        => $sign,
            'access_token' => $accessToken,
            'user_id'     => $userId,
            'session_id'  => $sessionId,
            'offset'      => $offset,
            'page_size'   => $pageSize,
        ]);

        $url = "{$this->host}{$path}?{$query}";

        $resp = Http::withHeaders(['Content-Type' => 'application/json'])
            ->get($url);

        $json = json_decode($resp->body(), true);

        Log::channel('webhook_shopee_new')->info(
            "📦 Shopee Get Item List Response\n" .
                json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );

        return response()->json($json, $resp->status(), [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    public function shopeeGetSessionMetric(Request $req)
    {
        $partnerId   = $req->input('partner_id');
        $partnerKey  = trim($req->input('partner_key'));
        $userId      = (int) $req->input('user_id');
        $accessToken = $req->input('access_token');
        $sessionId   = (int) $req->input('session_id');

        if (!$partnerId || !$partnerKey || !$userId || !$accessToken || !$sessionId) {
            return response()->json(['error' => 'missing required params'], 422);
        }

        $timestamp = time();
        $path      = "/api/v2/livestream/get_session_metric";
        $sign      = $this->generateSign($partnerId, $partnerKey, $path, $timestamp, $accessToken, $userId);

        // ✅ GET request → query string
        $query = http_build_query([
            'partner_id'   => $partnerId,
            'timestamp'    => $timestamp,
            'sign'         => $sign,
            'access_token' => $accessToken,
            'user_id'      => $userId,
            'session_id'   => $sessionId,
        ]);

        $url = "{$this->host}{$path}?{$query}";

        $resp = Http::withHeaders(['Content-Type' => 'application/json'])->get($url);
        $json = json_decode($resp->body(), true);

        Log::channel('webhook_shopee_new')->info(
            "📊 Shopee Get Session Metric Response\n" .
                json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );

        return response()->json($json, $resp->status(), [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    public function shopeeGetSessionItemMetric(Request $req)
    {
        $partnerId   = $req->input('partner_id');
        $partnerKey  = trim($req->input('partner_key'));
        $userId      = (int)$req->input('user_id');
        $accessToken = $req->input('access_token');
        $sessionId   = (int)$req->input('session_id');
        $offset      = (int)$req->input('offset', 0);
        $pageSize    = (int)$req->input('page_size', 10);

        if (!$partnerId || !$partnerKey || !$userId || !$accessToken || !$sessionId) {
            return response()->json(['error' => 'missing required params'], 422);
        }

        $timestamp = time();
        $path      = "/api/v2/livestream/get_session_item_metric";
        $sign      = $this->generateSign($partnerId, $partnerKey, $path, $timestamp, $accessToken, $userId);

        // ✅ GET request
        $query = http_build_query([
            'partner_id'   => $partnerId,
            'timestamp'    => $timestamp,
            'sign'         => $sign,
            'access_token' => $accessToken,
            'user_id'      => $userId,
            'session_id'   => $sessionId,
            'offset'       => $offset,
            'page_size'    => $pageSize
        ]);

        $url = "{$this->host}{$path}?{$query}";

        $resp = Http::withHeaders(['Content-Type' => 'application/json'])->get($url);
        $json = json_decode($resp->body(), true);

        Log::channel('webhook_shopee_new')->info(
            "📦 Shopee Get Session Item Metric Response\n" .
                json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );

        return response()->json($json, $resp->status(), [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    public function shopeeGetLatestCommentList(Request $req)
    {
        $partnerId   = $req->input('partner_id');
        $partnerKey  = trim($req->input('partner_key'));
        $userId      = (int)$req->input('user_id');
        $accessToken = $req->input('access_token');
        $sessionId   = (int)$req->input('session_id');
        $offset      = (int)$req->input('offset', 0);

        if (!$partnerId || !$partnerKey || !$userId || !$accessToken || !$sessionId) {
            return response()->json(['error' => 'missing required params'], 422);
        }

        $timestamp = time();
        $path      = "/api/v2/livestream/get_latest_comment_list";
        $sign      = $this->generateSign($partnerId, $partnerKey, $path, $timestamp, $accessToken, $userId);

        $query = http_build_query([
            'partner_id'   => $partnerId,
            'timestamp'    => $timestamp,
            'sign'         => $sign,
            'access_token' => $accessToken,
            'user_id'      => $userId,
            'session_id'   => $sessionId,
            'offset'       => $offset
        ]);

        $url  = "{$this->host}{$path}?{$query}";
        $resp = Http::withHeaders(['Content-Type' => 'application/json'])->get($url);
        $json = json_decode($resp->body(), true);

        Log::channel('webhook_shopee_new')->info(
            "📝 Shopee Get Latest Comment List Response\n" .
                json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );

        return response()->json($json, $resp->status(), [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    public function shopeePostComment(Request $req)
    {
        $partnerId   = $req->input('partner_id');
        $partnerKey  = trim($req->input('partner_key'));
        $userId      = (int)$req->input('user_id');
        $accessToken = $req->input('access_token');
        $sessionId   = (int)$req->input('session_id');
        $content     = $req->input('content');

        if (!$partnerId || !$partnerKey || !$userId || !$accessToken || !$sessionId || !$content) {
            return response()->json(['error' => 'missing required params'], 422);
        }

        if (strlen($content) > 150) {
            return response()->json(['error' => 'Content cannot exceed 150 characters'], 422);
        }

        $timestamp = time();
        $path      = "/api/v2/livestream/post_comment";
        $sign      = $this->generateSign($partnerId, $partnerKey, $path, $timestamp, $accessToken, $userId);

        $url = "{$this->host}{$path}?partner_id={$partnerId}&timestamp={$timestamp}&sign={$sign}&access_token={$accessToken}&user_id={$userId}";

        $body = [
            "session_id" => $sessionId,
            "content"    => $content
        ];

        $resp = Http::withHeaders(['Content-Type' => 'application/json'])->post($url, $body);
        $json = json_decode($resp->body(), true);

        Log::channel('webhook_shopee_new')->info(
            "💬 Shopee Post Comment Response\n" .
                json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );

        return response()->json($json, $resp->status(), [], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
}
