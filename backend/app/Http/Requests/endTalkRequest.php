<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class endTalkRequest extends FormRequest
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
            'rateId' => 'required|integer',
            'tagId' => 'required|integer',
            'activeConversationId' => 'required|integer',
        ];
    }

    public function messages(): array{
        return [
            'rateId.required' => 'ไม่พบ field rateId',
            'tagId.required' => 'ไม่พบ field tagId',
            'activeConversationId.required' => 'ไม่พบ field activeConversationId',
        ];
    }
}
