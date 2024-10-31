<?php
namespace App\Services;
use App\Models\UserRooms;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

class UserRoomService
{
    public function store($empCode, $listRoom) : array
    {
        $data['status'] = false;
        $data['message'] = 'เกิดข้อผิดพลาด';
        try {
            // หา listRoom ของ empCode คนนี้ก่อน
            DB::beginTransaction();
            UserRooms::where('empCode', $empCode)->delete();
            Log::info($listRoom);
            foreach ($listRoom as $room) {
                $store = new UserRooms();
                $store['empCode'] = $empCode;
                $store['roomId'] = $room;
                if ($store->save()) {

                } else throw new \Exception('ไม่สามารถบันทึกข้อมูลได้');
            }
            $data['status'] = true;
            $data['message'] = 'บันทึกข้อมูลเสร็จสิ้น';
            DB::commit();
        } catch (QueryException $q) {
            DB::rollBack();
            $data['message'] = 'เกิดข้อผิดพลาดระหว่างการเพิ่มข้อมูล';
            Log::info('เกิดข้อผิดพลาด( QueryException ) ที่ method Store ใน UserRoomService >>>');
            Log::error($q);
        } catch (\Exception $e) {
            $data['message'] = 'เกิดข้อผิดพลาดที่ no sql';
            Log::info('เกิดข้อผิดพลาดที่ method Store ใน UserRoomService >>>');
            Log::error($e);
            DB::rollBack();
        } finally {
            return $data;
        }

    }

    public function delete($empCode) : array
    {
        $data['status'] = false;
        $data['message'] = 'เกิดข้อผิดพลาด';
        try {
            // หา listRoom ของ empCode คนนี้ก่อน
            DB::beginTransaction();
            UserRooms::where('empCode', $empCode)->delete();
            $data['status'] = true;
            $data['message'] = 'บันทึกข้อมูลเสร็จสิ้น';
            DB::commit();
        } catch (QueryException $q) {
            DB::rollBack();
            $data['message'] = 'เกิดข้อผิดพลาดระหว่างการเพิ่มข้อมูล';
            Log::info('เกิดข้อผิดพลาด( QueryException ) ที่ method delete ใน UserRoomService >>>');
            Log::error($q);
        } catch (\Exception $e) {
            Log::info('เกิดข้อผิดพลาดที่ method delete ใน UserRoomService >>>');
            Log::error($e);
            DB::rollBack();
        } finally {
            return $data;
        }
    }
}
