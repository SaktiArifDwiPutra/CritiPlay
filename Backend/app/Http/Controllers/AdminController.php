<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function getAllUsers()
    {
        $users = User::withCount('games')->get();
        return response()->json($users);
    }
}