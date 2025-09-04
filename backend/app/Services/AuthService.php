<?php
namespace App\Services;


use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthService{
    public function register($data){
        return User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'empCode' => $data['empCode'],
            'description' => $data['description'],
            'avatar' => $data['avatar'] ?? '',
            'roomId' => $data['roomId'],
            'role' => $data['role'],
        ]);
    }
}
