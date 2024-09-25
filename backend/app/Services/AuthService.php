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
            'empCode' => $data['code'],
            'description' => $data['description'],
            'avatar' => $data['avatar'],
            'roomId' => $data['rooms'],
            'role' => $data['role'],
        ]);
    }
}
