<?php
// app/Services/OcrService.php

namespace App\Services;

use thiagoalessio\TesseractOCR\TesseractOCR;
use Illuminate\Support\Facades\Log;


class OcrService
{
    public function extractTextFromImage(string $imagePath): string
    {
        try {
            return (new TesseractOCR($imagePath))
                ->lang('tha+eng') // รองรับภาษาไทยและอังกฤษ
                ->run();
        } catch (\Exception $e) {
            Log::error("OCR Error: " . $e->getMessage());
            return '';
        }
    }
}
