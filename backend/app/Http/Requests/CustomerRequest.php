<?php

namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class CustomerRequest extends FormRequest
{
    public function authorize() : bool
    {
        return true;
    }
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
