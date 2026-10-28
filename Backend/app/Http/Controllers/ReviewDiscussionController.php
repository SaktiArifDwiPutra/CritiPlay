<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\ReviewDiscussion;
use Illuminate\Http\Request;

class ReviewDiscussionController extends Controller
{
    public function index($reviewId)
    {
        $review = Review::find($reviewId);
        if (!$review) {
            return response()->json(['message' => 'Review tidak ditemukan.'], 404);
        }

        $discussions = ReviewDiscussion::where('review_id', $reviewId)
            ->with('user')
            ->orderBy('created_at', 'asc') 
            ->get()
            ->map(fn ($d) => [
                'id'         => (string) $d->id,
                'userId'     => (string) $d->user_id,
                'userName'   => $d->user->name ?? 'Unknown',
                'userAvatar' => $d->user->avatar ? asset('storage/' . $d->user->avatar) : null,
                'gamerStats' => $d->user ? $d->user->getGamerStats() : null,
                'content'    => $d->content,
                'dateAdded'  => $d->created_at->toISOString(),
            ]);

        return response()->json($discussions);
    }

    public function store(Request $request, $reviewId)
    {
        $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $review = Review::find($reviewId);
        if (!$review) {
            return response()->json(['message' => 'Review tidak ditemukan.'], 404);
        }

        $discussion = ReviewDiscussion::create([
            'review_id' => $reviewId,
            'user_id'   => $request->user()->id,
            'content'   => $request->input('content'),
        ]);

        $discussion->load('user');

        return response()->json([
            'message' => 'Komentar berhasil ditambahkan.',
            'data' => [
                'id'         => (string) $discussion->id,
                'userId'     => (string) $discussion->user_id,
                'userName'   => $discussion->user->name,
                'userAvatar' => $discussion->user->avatar ? asset('storage/' . $discussion->user->avatar) : null,
                'gamerStats' => $discussion->user ? $discussion->user->getGamerStats() : null,
                'content'    => $discussion->content,
                'dateAdded'  => $discussion->created_at->toISOString(),
            ],
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $discussion = ReviewDiscussion::find($id);

        if (!$discussion) {
            return response()->json(['message' => 'Komentar tidak ditemukan.'], 404);
        }

        // cuma pemilik komentar yang boleh hapus
        if ($discussion->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        $discussion->delete();

        return response()->json(['message' => 'Komentar dihapus.']);
    }
}