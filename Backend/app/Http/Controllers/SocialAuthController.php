<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
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
        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');

        try {
            $googleUser = Socialite::driver('google')->user();

            $user = User::where('google_id', $googleUser->id)
                        ->orWhere('email', $googleUser->email)
                        ->first();

            if (!$user) {
                $user = User::create([
                    'name'              => $googleUser->name,
                    'email'             => $googleUser->email,
                    'google_id'         => $googleUser->id,
                    'password'          => Hash::make(Str::random(24)),
                    'email_verified_at' => now(),
                ]);
            } else {
                if (!$user->google_id) {
                    $user->update([
                        'google_id'         => $googleUser->id,
                        'email_verified_at' => $user->email_verified_at ?? now(),
                    ]);
                }
            }

            $token = $user->createToken('critiplay_token')->plainTextToken;

            return redirect($frontendUrl . '/google-callback?token=' . $token);

        } catch (\Exception $e) {
            Log::error('Google Auth Error: ' . $e->getMessage());
            return redirect($frontendUrl . '/login?error=auth_failed');
        }
    }
}