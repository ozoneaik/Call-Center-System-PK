<?php

namespace App\Http\Controllers;

use App\Models\Notes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotesController extends Controller
{
    public function listAll(): JsonResponse
    {
        $notes = DB::table('notes')
            ->leftJoin('customers', 'customers.custId', '=', 'notes.custId')
            ->select('notes.id', 'notes.custId', 'notes.text', 'notes.created_at', 'customers.custName')
            ->orderBy('notes.created_at', 'asc')->get();
        return response()->json([
            'notes' => $notes
        ]);
    }

    public function selectNote($custId)
    {
        $result = DB::table('active_conversations')
            ->leftJoin('rates', 'rates.id', '=', 'active_conversations.rateRef')
            ->where('active_conversations.custId', $custId)
            ->select('active_conversations.id as ac_id','rates.id as rate_id', 'rates.status','rates.custId')
            ->orderBy('active_conversations.id', 'desc')
            ->first();
            $result->status === 'progress' ? $result->active = 1 : $result->active = 0;
        return response()->json($result);
    }
    public function list($custId): JsonResponse
    {
        $notes = Notes::query()->where('custId', $custId)->orderBy('created_at', 'desc')->get();
        return response()->json([
            'custId' => $custId,
            'notes' => $notes
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $note = new Notes();
        $note['custId'] = $request['custId'];
        $note['text'] = $request['text'];
        $note->save();
        return response()->json([
            'message' => 'Note created'
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $note = Notes::query()->findOrFail($request['id']);
        $note['text'] = $request['text'];
        $note->save();
        return response()->json([
            'message' => 'Note updated'
        ]);
    }

    public function delete($noteId): JsonResponse
    {
        $note = Notes::query()->findOrFail($noteId);
        $note->delete();
        return response()->json([
            'message' => 'Note deleted'
        ]);
    }
}
