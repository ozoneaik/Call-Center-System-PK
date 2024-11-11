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
            'email.required' => 'จำเป็นต้องกรอกรหัสพนักงาน',
            'email.email' => 'รหัสพนักงานไม่ถูกต้อง',
            'email.exists' => 'ไม่พบรหัสพนักงานนี้ในระบบ โปรดลองอีกครั้งหรือติดต่อผู้ดูแลระบบ (IT)',
            'password.required' => 'จำเป็นต้องกรอกรหัสผ่าน',
            'password.string' => 'รูปแบบรหัสผ่านต้องเป็นตัวอักษร',
        ];
    }

}
