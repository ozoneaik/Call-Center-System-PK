<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class sendToRequest extends FormRequest
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
            'activeConversationId' => 'required',
            'latestRoomId' => 'required',
        ];
    }

    public function messages(): array{
        return [
            'rateId.required' => 'ไม่พบ field rateId',
            'activeConversationId.required' => 'ไม่พบ field activeConversationId',
            'latestRoomId.required' => 'ไม่พบ field latestRoomId'
        ];
    }
}
