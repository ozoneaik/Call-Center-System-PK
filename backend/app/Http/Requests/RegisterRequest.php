<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
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
            'empCode' => 'required|unique:users,empCode',
            'name' => 'required|string|max:255',
            'role' => 'required',
            'roomId' => 'required',
            'email' => 'required|email|unique:users,email|max:255',
            'password' => [
                'required',
                'string',
                Password::min(4),
                'confirmed',
            ]
        ];
    }

    public function messages(): array {
        return [
            'empCode.required' => 'กรุณากรอกรหัสพนักงาน',
            'empCode.unique' => 'รหัสพนักงานนี้ถูกใช้งานแล้ว',
            'name.required' => 'ไม่พบชื่อ',
            'name.max' => 'ชื่อต้องมีความยาวไม่เกิน 255 ตัวอักษร',
            'role.required' => 'กรุณาเลือกสิทธิ์การใช้งาน',
            'roomId.required' => 'กรุณาเลือกห้องแชท',
            'email.required' => 'กรุณากรอกอีเมล',
            'email.email' => 'อีเมลไม่ถูกต้อง',
            'email.unique' => 'อีเมลนี้ถูกใช้งานแล้ว',
            'password.required' => 'กรุณากรอกรหัสผ่าน',
            'password.min' => 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร',
            'password.confirmed' => 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน',
        ];
    }
}
