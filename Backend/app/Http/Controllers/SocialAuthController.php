<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    public function redirect()
    {
        // Tanpa stateless karena session web sudah aktif
        return Socialite::driver('google')->redirect();
    }

public function callback()
{
    try {
        $googleUser = Socialite::driver('google')->user();

        $user = User::where('google_id', $googleUser->id)
                    ->orWhere('email', $googleUser->email)
                    ->first();

        if (!$user) {
            $user = User::create([
                'name' => $googleUser->name,
                'email' => $googleUser->email,
                'google_id' => $googleUser->id,
                'password' => Hash::make(Str::random(24)),
            ]);
        } else {
            if (!$user->google_id) {
                $user->update(['google_id' => $googleUser->id]);
            }
        }

        $token = $user->createToken('critiplay_token')->plainTextToken;

        return redirect('http://localhost:5173/google-callback?token=' . $token);

    } catch (\Exception $e) {
        // CETAK ERROR ASLINYA KE LAYAR, JANGAN DI-REDIRECT DULU!
        dd($e->getMessage());
    }
}
}