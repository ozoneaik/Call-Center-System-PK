<?php

namespace App\Http\Controllers;

use App\Models\ChatRooms;
use App\Models\PlatformAccessTokens;
use App\Models\PlatformRoutingRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlatformRoutingController extends Controller
{
    /**
     * ดึงรายการ platform tokens ทั้งหมด พร้อม routing rules ของแต่ละ token
     */
    public function index(): JsonResponse
    {
        $tokens = PlatformAccessTokens::orderBy('platform')->orderBy('description')->get();
        $rooms = ChatRooms::where('is_active', 1)->get(['roomId', 'roomName']);
        $rules = PlatformRoutingRule::all()->groupBy('token_id');

        $tokensWithRules = $tokens->map(function ($token) use ($rooms, $rules) {
            $tokenRules = $rules->get($token->id, collect());
            $rulesByRoom = $tokenRules->keyBy('room_id');

            $roomPermissions = $rooms->map(function ($room) use ($rulesByRoom) {
                $rule = $rulesByRoom->get($room->roomId);
                return [
                    'roomId'            => $room->roomId,
                    'roomName'          => $room->roomName,
                    'is_allowed'        => $rule ? (bool) $rule->is_allowed : true,
                    'allow_create_case' => $rule ? (bool) $rule->allow_create_case : true,
                    'has_rule'          => (bool) $rule,
                ];
            });

            return [
                'id'              => $token->id,
                'platform'        => $token->platform,
                'description'     => $token->description,
                'accessTokenId'   => $token->accessTokenId,
                'room_permissions' => $roomPermissions,
            ];
        });

        return response()->json([
            'message' => 'success',
            'tokens'  => $tokensWithRules,
            'rooms'   => $rooms,
        ]);
    }

    /**
     * บันทึก/อัพเดท routing rules ของ token นั้นๆ ทั้งหมดในครั้งเดียว
     * Body: { token_id, rules: [{ roomId, is_allowed }] }
     */
    public function updateRules(Request $request): JsonResponse
    {
        $request->validate([
            'token_id'       => 'required|exists:platform_access_tokens,id',
            'rules'          => 'required|array',
            'rules.*.roomId' => 'required|string',
        ]);

        try {
            DB::beginTransaction();

            foreach ($request->rules as $rule) {
                PlatformRoutingRule::updateOrCreate(
                    ['token_id' => $request->token_id, 'room_id' => $rule['roomId']],
                    [
                        'is_allowed'        => filter_var($rule['is_allowed'] ?? true, FILTER_VALIDATE_BOOLEAN),
                        'allow_create_case' => filter_var($rule['allow_create_case'] ?? true, FILTER_VALIDATE_BOOLEAN),
                    ]
                );
            }

            DB::commit();

            return response()->json(['message' => 'บันทึกสิทธิ์การส่งต่อสำเร็จ'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'เกิดข้อผิดพลาด', 'detail' => $e->getMessage()], 500);
        }
    }

    /**
     * คืนเฉพาะห้องพร้อม is_allowed ตาม type ที่ขอ
     * ?type=forward (default) → ใช้ is_allowed
     * ?type=create_case       → ใช้ allow_create_case
     */
    public function allowedRooms(Request $request, int $tokenId): JsonResponse
    {
        $type  = $request->query('type', 'forward');
        $field = $type === 'create_case' ? 'allow_create_case' : 'is_allowed';

        $rules = PlatformRoutingRule::where('token_id', $tokenId)->get()->keyBy('room_id');
        $rooms = ChatRooms::where('is_active', 1)->get(['roomId', 'roomName']);

        $result = $rooms->map(function ($room) use ($rules, $field) {
            $rule = $rules->get($room->roomId);
            return [
                'roomId'     => $room->roomId,
                'roomName'   => $room->roomName,
                'is_allowed' => $rule ? (bool) $rule->$field : true,
            ];
        })->values();

        return response()->json(['rooms' => $result]);
    }

    /**
     * ตรวจสอบว่า token นั้นสามารถส่งต่อไปยัง room นั้นได้หรือไม่
     * ใช้ใน MessageController::sendTo
     */
    public static function isAllowed(int $tokenId, string $roomId): bool
    {
        $rule = PlatformRoutingRule::where('token_id', $tokenId)
            ->where('room_id', $roomId)
            ->first();

        // ถ้าไม่มี rule → อนุญาตโดย default
        return $rule ? $rule->is_allowed : true;
    }
}
