<?php

namespace App\Http\Controllers;

use App\Models\Notes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotesController extends Controller
{
    public function list($custId) : JsonResponse {
        $notes = Notes::where('custId', $custId)->orderBy('created_at','desc')->get();
        return response()->json([
            'custId' => $custId,
            'notes' => $notes
        ]);
    }

    public function store(Request $request) : JsonResponse {
        $note = new Notes();
        $note['custId'] = $request['custId'];
        $note['text'] = $request['text'];
        $note->save();
        return response()->json([
            'message' => 'Note created'
        ]);
    }

    public function update(Request $request) : JsonResponse {
        $note = Notes::findOrFail($request['id']);
        $note['text'] = $request['text'];
        $note->save();
        return response()->json([
            'message' => 'Note updated'
        ]);
    }

    public function delete($noteId) : JsonResponse {
        $note = Notes::findOrFail($noteId);
        $note->delete();
        return response()->json([
            'message' => 'Note deleted'
        ]);
    }
}
