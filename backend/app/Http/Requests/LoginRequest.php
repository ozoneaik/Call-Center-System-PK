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
            'email.required' => 'อีเมลไม่ถูกต้อง',
            'password.required' => 'รหัสไม่ถูกต้อง',
        ];
    }
    protected function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->email && $this->password) {
                if (!auth()->attempt($this->only('email', 'password'))) {
                    $validator->errors()->add('email', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
                }
            }
        });
    }
}
