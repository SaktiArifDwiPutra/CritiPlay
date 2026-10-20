<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Review;

class LibraryController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status', 'all');
        $userId = $request->user()->id;

        $query = $request->user()->games();

        if ($status !== 'all') {
            $query->wherePivot('status', $status);
        }

        $library = $query->get()->map(function ($game) use ($userId) {
            $review = Review::where('user_id', $userId)
                ->where('game_id', $game->id)
                ->first();

            $game->user_review = $review ? [
                'id'              => (string) $review->id,
                'rating_gameplay' => (float) $review->rating_gameplay,
                'rating_story'    => (float) $review->rating_story,
                'rating_visual'   => (float) $review->rating_visual,
                'rating_overall'  => (float) $review->rating_overall,
                'review_text'     => $review->review_text,
            ] : null;

            return $game;
        });

        return response()->json($library, 200);
    }

    public function addOrUpdate(Request $request)
    {
        $request->validate([
            'game_id' => 'required|exists:games,id',
            'status'  => 'required|in:plan_to_play,playing,completed,dropped'
        ]);

        $user = $request->user();

        $user->games()->syncWithoutDetaching([
            $request->game_id => ['status' => $request->status]
        ]);

        return response()->json([
            'message' => 'Game berhasil disimpan di Library dengan status: ' . $request->status
        ], 200);
    }

    public function remove(Request $request, $gameId)
    {
        $request->user()->games()->detach($gameId);

        return response()->json([
            'message' => 'Game berhasil dihapus dari Library.'
        ], 200);
    }
}