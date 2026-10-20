<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;


class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $otp = random_int(100000, 999999);

        $user = User::create([
            'name'           => $request->name,
            'email'          => $request->email,
            'password'       => Hash::make($request->password),
            'otp'            => $otp,
            'otp_expires_at' => Carbon::now()->addMinutes(10),
        ]);

        try {
            Mail::raw("Your CritiPlay verification code is {$otp}.", function ($message) use ($user) {
                $message->to($user->email)->subject('CritiPlay OTP Verification');
            });
        } catch (\Exception $e) {
            Log::error('Gagal kirim OTP: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Registrasi berhasil. Silakan cek email Anda untuk kode OTP.',
            'email'   => $user->email,
        ], 201);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'otp'   => 'required|numeric|digits:6',
        ]);

        $user = User::where('email', $request->email)->first();

        if ((string) $user->otp !== (string) $request->otp) {
            return response()->json([
                'message' => 'Kode OTP salah atau tidak valid.'
            ], 422);
        }

        if (Carbon::now()->greaterThan($user->otp_expires_at)) {
            return response()->json([
                'message' => 'Kode OTP sudah kedaluwarsa. Silakan minta kode baru.'
            ], 422);
        }

        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Email sudah diverifikasi.'
            ], 400);
        }

        $user->otp = null;
        $user->otp_expires_at = null;
        $user->email_verified_at = Carbon::now();
        $user->save();

        $token = $user->createToken('critiplay_token')->plainTextToken;

        return response()->json([
            'message' => 'Verifikasi email berhasil!',
            'user'    => $user,
            'token'   => $token,
        ], 200);
    }

    public function resendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();

        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Email sudah diverifikasi.'
            ], 400);
        }

        $otp = random_int(100000, 999999);
        $user->otp = $otp;
        $user->otp_expires_at = Carbon::now()->addMinutes(10);
        $user->save();

        Mail::raw("Your CritiPlay verification code is {$otp}.", function ($message) use ($user) {
            $message->to($user->email)->subject('CritiPlay OTP Verification');
        });

        return response()->json([
            'message' => 'Kode OTP baru telah dikirim ke email Anda.'
        ], 200);
        
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        if (is_null($user->email_verified_at)) {
            return response()->json([
                'message' => 'Akun belum diverifikasi. Silakan cek email Anda untuk kode OTP.'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function profile(Request $request)
    {
        $user = $request->user();

        $libraryStats = [
            'total_games'  => $user->games()->count(),
            'completed'    => $user->games()->wherePivot('status', 'completed')->count(),
            'playing'      => $user->games()->wherePivot('status', 'playing')->count(),
            'plan_to_play' => $user->games()->wherePivot('status', 'plan_to_play')->count(),
            'dropped'      => $user->games()->wherePivot('status', 'dropped')->count(),
        ];

        $totalReviews = $user->reviews()->count();

        $avgRatings = [
            'gameplay' => round((float) $user->reviews()->avg('rating_gameplay'), 1) ?: 0,
            'story'    => round((float) $user->reviews()->avg('rating_story'), 1) ?: 0,
            'visual'   => round((float) $user->reviews()->avg('rating_visual'), 1) ?: 0,
            'overall'  => round((float) $user->reviews()->avg('rating_overall'), 1) ?: 0,
        ];

        $recentGames = $user->games()
            ->orderByPivot('updated_at', 'desc')
            ->limit(4)
            ->get();

        return response()->json([
            'user' => [
                'id'        => $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'avatar'    => $user->avatar, 
                'joined_at' => $user->created_at->format('d M Y'),
            ],
            'stats' => [
                'library'       => $libraryStats,
                'total_reviews' => $totalReviews,
                'avg_ratings'   => $avgRatings,
            ],
            'recent_activity' => $recentGames,
        ], 200);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg|max:2048'
        ]);

        $user->name = $request->input('name');
        $newEmail = $request->input('email');
        $emailChanged = false;

        if ($newEmail !== $user->email) {
            $emailChanged = true;
            $otp = random_int(100000, 999999);

            $user->email = $newEmail;
            $user->email_verified_at = null;
            $user->otp = $otp;
            $user->otp_expires_at = Carbon::now()->addMinutes(10);

            try {
                Mail::raw("Your CritiPlay verification code is {$otp}.", function ($message) use ($user) {
                    $message->to($user->email)->subject('CritiPlay OTP Verification');
                });
            } catch (\Exception $e) {
                Log::error('Gagal kirim OTP update email: ' . $e->getMessage());
            }
        }

        if ($request->hasFile('avatar')) {
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }

            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = $path;
        }

        $user->save();

        $message = $emailChanged
            ? 'Profil berhasil diperbarui. Silakan cek email baru Anda untuk kode OTP verifikasi.'
            : 'Profil berhasil diperbarui';

        return response()->json([
            'message' => $message,
            'email_changed' => $emailChanged,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar ? asset('storage/' . $user->avatar) : null
            ]
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'Link reset password berhasil dibuat.'
            ]);
        }

        return response()->json([
            'message' => 'Email tidak ditemukan.'
        ], 404);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->password = Hash::make($password);
                $user->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Password berhasil direset.'
            ]);
        }

        return response()->json([
            'message' => 'Token reset password tidak valid atau sudah kedaluwarsa.'
        ], 400);
    }
}