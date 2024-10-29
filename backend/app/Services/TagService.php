<?php

namespace App\Services;

use App\Models\TagMenu;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TagService
{
    public function list(): array
    {
        $data['status'] = false;
        $data['message'] = 'ไม่มีข้อผิดพลาด';
        $data['list'] = [];
        try {
            $data['list'] = TagMenu::orderBy('id', 'asc')->get();
            $data['status'] = true;
        } catch (\Exception $e) {
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function store($tagName): array
    {
        $data['status'] = false;
        $data['message'] = 'ไม่มีข้อผิดพลาด';
        $data['tag'] = [];
        try {
            DB::beginTransaction();
            $store = new TagMenu();
            $store['tagName'] = $tagName;
            if ($store->save()) {
                $data['status'] = true;
                $data['tag'] = $store;
            }else throw new \Exception('ไม่สามารถสร้าง tag การจบสนทนาได้');
            DB::commit();
        }catch (QueryException $e){
            DB::rollBack();
            Log::error("เกิดปัญหาที่ method Store ใน TagService");
            Log::error($e->getMessage());
            $data['message'] = 'เกิดปัญหาตอน query';
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("เกิดปัญหาที่ method Store ใน TagService");
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function update($tagName,$id): array
    {
        $data['status'] = false;
        $data['message'] = 'ไม่มีข้อผิดพลาด';
        $data['tag'] = [];
        try {
            DB::beginTransaction();
            $update = TagMenu::findOrFail($id);
            $update['tagName'] = $tagName;
            if ($update->save()) {
                $data['status'] = true;
                $data['tag'] = $update;
            }else throw new \Exception('ไม่สามารถสร้าง tag การจบสนทนาได้');
            DB::commit();
        }catch (QueryException $e){
            DB::rollBack();
            Log::error("เกิดปัญหาที่ method update ใน TagService [query]");
            Log::error($e->getMessage());
            $data['message'] = 'เกิดปัญหาตอน query';
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("เกิดปัญหาที่ method update ใน TagService $id");
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

    public function delete($id) : array
    {
        $data['status'] = false;
        $data['message'] = 'ไม่มีข้อผิดพลาด';
        try {
            DB::beginTransaction();
            $delete = TagMenu::findOrFail($id)->delete();
            $data['status'] = true;
            $data['tagDelete'] = $delete;
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            $data['message'] = $e->getMessage();
        } finally {
            return $data;
        }
    }

}
