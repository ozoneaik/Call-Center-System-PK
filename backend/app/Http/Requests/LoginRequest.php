<?php

namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{

    public function authorize(): bool
    {
        return true;
    }
    public function rules(): array
    {
        return [
            'email' => 'required|email|exists:users,email',
            'password' => 'required|string',
        ];
    }

    public function messages() : array {
        return [
            'email.required' => 'กรุณากรอกอีเมล',
            'email.email' => 'รูปแบบอีเมลไม่ถูกต้อง',
            'email.exists' => 'ไม่พบบัญชีที่ใช้อีเมลนี้',
            'password.required' => 'กรุณากรอกรหัสผ่าน',
            'password.string' => 'รูปแบบรหัสผ่านต้องเป็นตัวอักษร',
        ];
    }

}
