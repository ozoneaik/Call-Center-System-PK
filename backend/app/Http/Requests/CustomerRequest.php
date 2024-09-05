<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CustomerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize() : bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'custId' => 'required',
            'roomId' => 'required',
        ];
    }

    public function messages(): array{
        return [
            'custId.required' => 'custId is required',
            'roomId.required' => 'roomId is required',
        ];
    }
}
