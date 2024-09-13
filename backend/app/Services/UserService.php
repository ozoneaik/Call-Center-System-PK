<?php
namespace App\Services;


use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class UserService{
    public function getAllUsers(): Collection
    {
        return User::all();
    }

    public function delete($code) : bool{
        try {
            if ($code === auth()->user()->code){
                return false;
            }
            return User::where('code', $code)->delete();
        }catch (\Exception $e){
            return false;
        }
    }
}
