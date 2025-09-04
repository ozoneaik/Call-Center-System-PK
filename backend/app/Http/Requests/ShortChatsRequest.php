<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;



class ShortChatsRequest extends FormRequest
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
            'groups' => 'required|array',
            'models' => 'required|array',
            'problems' => 'required|array',
            'content' => 'required',
        ];
    }

    public function messages(): array{
        return [
            'groups.required' => 'กรุณากรอกหมวดหมู่',
            'models.required' => 'กรุณากรอกรุ่น',
            'problems.required' => 'กรุณากรอกปัญหา',
            'content.required' => 'กรุณากรอกข้อความส่งด่วน',
        ];
    }

    protected function failedValidation(Validator $validator)
    {
        $errors = $validator->errors();
        throw new HttpResponseException(response()->json([
            'message' => 'เกิดข้อผิดพลาด',
            'detail' => $errors->first()
        ], 422));
    }
}
