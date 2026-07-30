<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HolidayController extends Controller
{
    public function index()
    {
        $holidays = Holiday::orderBy('start_date', 'asc')->get();
        return response()->json(['holidays' => $holidays]);
    }

    public function store(Request $request)
    {
        try {
            $holiday = new Holiday();
            $holiday->holiday_name = $request->holiday_name;
            $holiday->message = $request->message;
            $holiday->start_date = $request->start_date;
            $holiday->end_date = $request->end_date;
            $holiday->is_active = $request->is_active ?? true;
            $holiday->created_by = Auth::id();
            $holiday->save();
            return response()->json(['message' => 'สร้างวันหยุดสำเร็จ', 'holiday' => $holiday], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $holiday = Holiday::findOrFail($id);
            $holiday->holiday_name = $request->holiday_name;
            $holiday->message = $request->message;
            $holiday->start_date = $request->start_date;
            $holiday->end_date = $request->end_date;
            $holiday->is_active = $request->boolean('is_active', $holiday->is_active);
            $holiday->updated_by = Auth::id();
            $holiday->save();
            return response()->json(['message' => 'อัปเดตวันหยุดสำเร็จ', 'holiday' => $holiday], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    public function destroy($id)
    {
        try {
            $holiday = Holiday::findOrFail($id);
            $holiday->delete();
            return response()->json(['message' => 'ลบวันหยุดสำเร็จ'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
