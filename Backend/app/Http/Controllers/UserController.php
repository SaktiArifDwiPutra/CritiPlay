<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function publicProfile(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan.'], 404);
        }

        $libraryStats = [
            'total_games'  => $user->games()->count(),
            'completed'    => $user->games()->wherePivot('status', 'completed')->count(),
            'playing'      => $user->games()->wherePivot('status', 'playing')->count(),
            'plan_to_play' => $user->games()->wherePivot('status', 'plan_to_play')->count(),
            'dropped'      => $user->games()->wherePivot('status', 'dropped')->count(),
        ];

        $totalReviews = $user->reviews()->count();
        $recentGames = $user->games()
            ->orderByPivot('updated_at', 'desc')
            ->limit(5)
            ->get();

        $isFollowing = \App\Models\Follow::where('follower_id', $request->user()->id)
            ->where('following_id', $user->id)
            ->exists();

        return response()->json([
            'user' => [
                'id'        => $user->id,
                'name'      => $user->name,
                'avatar'    => $user->avatar ? asset('storage/' . $user->avatar) : null,
                'joined_at' => $user->created_at->format('d M Y'),
            ],
            'stats' => [
                'library'       => $libraryStats,
                'total_reviews' => $totalReviews,
                'followers_count' => $user->followers()->count(),
                'following_count' => $user->following()->count(),
                'is_following'    => $isFollowing, 
            ],
            'recent_activity' => $recentGames,
        ], 200);
    }

    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:1',
        ]);

        $query = trim($request->input('q'));
        $currentUserId = $request->user()->id;

        $users = User::whereRaw('LOWER(name) LIKE ?', ['%' . mb_strtolower($query, 'UTF-8') . '%'])
            ->where('id', '!=', $currentUserId) // jangan include diri sendiri
            ->limit(20)
            ->get()
            ->map(function ($user) {
                return [
                    'id'     => (string) $user->id,
                    'name'   => $user->name,
                    'avatar' => $user->avatar ? asset('storage/' . $user->avatar) : null,
                ];
            });

        return response()->json($users);
    }   
}