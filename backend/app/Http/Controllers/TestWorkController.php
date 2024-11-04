<?php

namespace App\Http\Controllers;

use App\Models\TestWork;
use Illuminate\Http\Request;

class TestWorkController extends Controller
{
    //

    public function delete($id){
        $delete = TestWork::find($id);
        $delete->delete();
    }
}
