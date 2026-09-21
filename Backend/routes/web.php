<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SocialAuthController;

// Bungkus dengan middleware 'web' agar Session Laravel aktif
Route::middleware(['web'])->group(function () {
    Route::get('/auth/google/redirect', [SocialAuthController::class, 'redirect']);
    Route::get('/auth/google/callback', [SocialAuthController::class, 'callback']);

    Route::get('/reset-password/{token}', function ($token) {
    return response()->json([
        'message' => 'Reset password page',
        'token' => $token,
    ]);
})->name('password.reset');
});