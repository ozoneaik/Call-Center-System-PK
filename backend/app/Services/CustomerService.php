<?php
namespace App\Services;
use App\Models\customers;
use Illuminate\Database\Eloquent\Collection;

class CustomerService{
    public function list(): Collection
    {
        return customers::all();
    }
}
