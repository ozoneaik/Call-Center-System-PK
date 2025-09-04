<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class sendMessageRequest extends FormRequest
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
            'custId' => 'required',
            'conversationId' => 'required',
            'messages' => 'required',
        ];
    }

    public function messages(): array{
        return [
            'custId.required' => 'ไม่พบ field custId',
            'conversationId.required' => 'ไม่พบ field conversationId',
            'messages.required' => 'ไม่พบ field messages',
        ];
    }
}
