<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GameController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\SocialAuthController;
use App\Http\Controllers\GameSearchController;
use App\Http\Controllers\GameImportController;
use App\Http\Controllers\LibraryController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\ReviewDiscussionController;
use App\Http\Controllers\GameReleaseController;
use App\Http\Controllers\StatisticsController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::post('/verify-otp', [AuthController::class, 'verifyOtp'])->middleware('throttle:5,1');
Route::post('/resend-otp', [AuthController::class, 'resendOtp'])->middleware('throttle:3,1');

Route::get('/auth/google/redirect', [SocialAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [SocialAuthController::class, 'callback']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/profile', [AuthController::class, 'updateProfile']);

    Route::get('/users/search', [UserController::class, 'search']);
    Route::get('/users/{id}/profile', [UserController::class, 'publicProfile']);
    Route::put('/users/showcase', [UserController::class, 'updateShowcase']);
    Route::post('/users/{userId}/follow', [FollowController::class, 'follow']);
    Route::delete('/users/{userId}/follow', [FollowController::class, 'unfollow']);
    Route::get('/users/{userId}/followers', [FollowController::class, 'followers']);
    Route::get('/users/{userId}/following', [FollowController::class, 'following']);

    Route::get('/games/search', [GameSearchController::class, 'search']);
    Route::post('/games/import', [GameImportController::class, 'import']);
    Route::get('/games/top-rated', [GameController::class, 'topRated']);
    Route::get('/games/top-rated-summary', [GameController::class, 'topRatedSummary']);
    Route::get('/games/most-played', [GameController::class, 'mostPlayed']);
    Route::get('/games/recommendations', [GameController::class, 'recommendations']);
    Route::get('/games/releases-summary', [GameReleaseController::class, 'summary']);
    Route::get('/games/releases/summary', [GameReleaseController::class, 'summary']);
    Route::get('/games/releases/{type}', [GameReleaseController::class, 'index'])
        ->whereIn('type', ['recent', 'upcoming', 'anticipated']);

    Route::apiResource('games', GameController::class)->only(['index', 'show']);
    Route::middleware('admin')->group(function () {
        Route::put('games/{id}', [GameController::class, 'update']);
        Route::delete('games/{id}', [GameController::class, 'destroy']);
    });
    Route::get('games/{game}/reviews', [ReviewController::class, 'getByGame']);
    Route::get('/reviews/recent', [ReviewController::class, 'recent']);
    Route::post('reviews', [ReviewController::class, 'store']);
    Route::put('reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('reviews/{id}', [ReviewController::class, 'destroy']);
    Route::post('/reviews/{id}/helpful', [ReviewController::class, 'toggleHelpful']);
    Route::get('/reviews/{id}/discussions', [ReviewDiscussionController::class, 'index']);
    Route::post('/reviews/{id}/discussions', [ReviewDiscussionController::class, 'store']);
    Route::delete('/discussions/{id}', [ReviewDiscussionController::class, 'destroy']);

    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/users', [AdminController::class, 'getAllUsers']);
    });

    Route::get('/library', [LibraryController::class, 'index']);
    Route::post('/library', [LibraryController::class, 'addOrUpdate']);
    Route::delete('/library/{gameId}', [LibraryController::class, 'remove']);

    Route::get('/statistics', [StatisticsController::class, 'index']);
});