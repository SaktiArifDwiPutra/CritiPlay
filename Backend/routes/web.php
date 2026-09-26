<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SocialAuthController;

// Bungkus dengan middleware 'web' agar Session Laravel aktif
Route::middleware(['web'])->group(function () {
    Route::get('/auth/google/redirect', [SocialAuthController::class, 'redirect']);
    Route::get('/auth/google/callback', [SocialAuthController::class, 'callback']);

});