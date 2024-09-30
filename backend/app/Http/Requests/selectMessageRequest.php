<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class selectMessageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'rateId' => 'required',
            'activeId' => 'required',
        ];
    }

    public function messages(): array
    {
        return [
            'rateId.required' => 'ไม่พบ field (R) บางอย่าง',
            'activeId.required' => 'ไม่พบ field (A) บางอย่าง',
        ];
    }
}
