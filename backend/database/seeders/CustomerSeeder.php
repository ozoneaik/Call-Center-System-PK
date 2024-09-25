<?php

namespace Database\Seeders;

use App\Models\Customers;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        Customers::create([
            'custId' => 'Udc58fac972b9291766343dc8f24632ba',
            'custName' => 'Nut',
            'description' => '💚',
            'avatar' => 'https://sprofile.line-scdn.net/0hUk4XTh5OCkQZIR6gS5t0O2lxCS46UFNWYU4Rci91USMsQxoaPBRGcSUjXHQtFR4QZRdDcSQjAHYVMn0iB3f2cB4RV3UlFk0XNkBCpA',
            'platform' => 'line',
        ]);
        Customers::create([
            'custId' => 'U46b6c4a6d94fc78d60c66f5e9703818a',
            'custName' => 'Bomb be',
            'description' => '.....',
            'avatar' => 'https://sprofile.line-scdn.net/0hE16ZemFiGh4bIwoK_1lkYWtzGXQ4UkMMN0NWeykjRSwgRl5LPkJVLC1xECh0FlVNMUFRf350TH0XMG14BXXmKhwTRy8nFF1NNEJS_g',
            'platform' => 'line',
        ]);
    }
}
