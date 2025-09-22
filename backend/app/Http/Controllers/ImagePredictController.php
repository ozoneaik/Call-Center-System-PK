<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ImagePredictController extends Controller
{
    //
    public function predictFromUrl(Request $request)
    {
        $url = $request->input('url');
        $response = Http::post("https://e30e4a913322.ngrok-free.app/predict_url", [
            'url' => $url
        ]);
        return response()->json($response->json());
    }

    public function predictUpload(Request $request)
    {
        if (!$request->hasFile('image')) {
            return response()->json(['error' => 'No image uploaded'], 400);
        }

        $file = $request->file('image');

        $response = Http::attach(
            'file',
            file_get_contents($file->getRealPath()),
            $file->getClientOriginalName()
        )->post('https://e30e4a913322.ngrok-free.app/predict');

        return response()->json($response->json());
    }
}
