<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\ReviewHelpfulVote;

class ReviewController extends Controller
{
    public function getByGame(Request $request, $gameId)
    {
        $currentUserId = $request->user()->id;

        $reviews = Review::where('game_id', $gameId)
            ->with('user', 'helpfulVotes')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($review) use ($currentUserId) {
                return [
                    'id'             => (string) $review->id,
                    'gameId'         => (string) $review->game_id,
                    'userId'         => (string) $review->user_id,
                    'userName'       => $review->user->name ?? 'Unknown',
                    'userAvatar'     => $review->user->avatar ? asset('storage/' . $review->user->avatar) : null,
                    'ratingGameplay' => $review->rating_gameplay,
                    'ratingStory'    => $review->rating_story,
                    'ratingVisual'   => $review->rating_visual,
                    'ratingOverall'  => $review->rating_overall,
                    'reviewText'     => $review->review_text,
                    'helpfulCount'   => $review->helpfulVotes->count(),
                    'isHelpfulByMe'  => $review->helpfulVotes->contains('user_id', $currentUserId),
                    'dateAdded'      => $review->created_at->toISOString(),
                ];
            });

        return response()->json($reviews);
    }

    public function recent(Request $request)
    {
        $validated = $request->validate([
            'limit' => 'nullable|integer|min:1|max:12',
        ]);

        $limit = $validated['limit'] ?? 4;
        $currentUserId = $request->user()?->id;

        $reviews = Review::whereNotNull('review_text')
            ->whereRaw("TRIM(review_text) != ''")
            ->whereHas('game')
            ->with([
                'user:id,name,avatar',
                'game:id,igdb_id,name,cover_url,release_year,genres,platforms,summary,avg_gameplay,avg_story,avg_visual,avg_overall,total_reviews',
            ])
            ->withCount('helpfulVotes')
            ->with('helpfulVotes')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($review) use ($currentUserId) {
                return [
                    'id'             => (string) $review->id,
                    'gameId'         => (string) $review->game_id,
                    'userId'         => (string) $review->user_id,
                    'userName'       => $review->user->name ?? 'Unknown',
                    'userAvatar'     => $review->user && $review->user->avatar
                        ? (str_starts_with($review->user->avatar, 'http') ? $review->user->avatar : asset('storage/' . $review->user->avatar))
                        : null,
                    'ratingGameplay' => (float) $review->rating_gameplay,
                    'ratingStory'    => (float) $review->rating_story,
                    'ratingVisual'   => (float) $review->rating_visual,
                    'ratingOverall'  => (float) $review->rating_overall,
                    'reviewText'     => $review->review_text,
                    'helpfulCount'   => (int) ($review->helpful_votes_count ?? $review->helpfulVotes->count()),
                    'isHelpfulByMe'  => $currentUserId ? $review->helpfulVotes->contains('user_id', $currentUserId) : false,
                    'dateAdded'      => $review->created_at?->toISOString(),
                    'game'           => $review->game ? [
                        'id'           => (string) $review->game->id,
                        'igdb_id'      => $review->game->igdb_id,
                        'name'         => $review->game->name,
                        'cover_url'    => $review->game->cover_url,
                        'release_year' => $review->game->release_year,
                        'genres'       => $review->game->genres ?? [],
                        'platforms'    => $review->game->platforms ?? [],
                        'summary'      => $review->game->summary,
                        'avgGameplay'  => (float) $review->game->avg_gameplay,
                        'avgStory'     => (float) $review->game->avg_story,
                        'avgVisual'    => (float) $review->game->avg_visual,
                        'avgOverall'   => (float) $review->game->avg_overall,
                        'totalReviews' => (int) $review->game->total_reviews,
                    ] : null,
                ];
            });

        return response()->json($reviews);
    }

    public function store(Request $request)
    {
        $request->validate([
            'game_id'         => 'required|exists:games,id',
            'rating_gameplay' => 'required|numeric|min:1|max:10',
            'rating_story'    => 'required|numeric|min:1|max:10',
            'rating_visual'   => 'required|numeric|min:1|max:10',
            'review_text'     => 'nullable|string',
        ]);

        $gameId = $request->game_id;
        $userId = $request->user()->id;

        if (Review::where('user_id', $userId)->where('game_id', $gameId)->exists()) {
            return response()->json(['message' => 'Kamu sudah mereview game ini!'], 400);
        }

        $overallUser = ($request->rating_gameplay + $request->rating_story + $request->rating_visual) / 3;

        $review = Review::create([
            'user_id'         => $userId,
            'game_id'         => $gameId,
            'rating_gameplay' => $request->rating_gameplay,
            'rating_story'    => $request->rating_story,
            'rating_visual'   => $request->rating_visual,
            'rating_overall'  => round($overallUser, 1),
            'review_text'     => $request->review_text,
        ]);

        $this->updateGameAverages($gameId);

        return response()->json(['message' => 'Review berhasil ditambahkan!', 'data' => $review], 201);
    }

    public function update(Request $request, $id)
    {
        $review = Review::find($id);
        if (!$review) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if ($review->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }
        $request->validate([
            'rating_gameplay' => 'sometimes|numeric|min:1|max:10',
            'rating_story' => 'sometimes|numeric|min:1|max:10',
            'rating_visual' => 'sometimes|numeric|min:1|max:10',
            'review_text' => 'nullable|string',
        ]);
        $review->update([
            'rating_gameplay' => $request->input('rating_gameplay', $review->rating_gameplay),
            'rating_story'    => $request->input('rating_story', $review->rating_story),
            'rating_visual'   => $request->input('rating_visual', $review->rating_visual),
            'review_text'     => $request->input('review_text', $review->review_text),
        ]);

        $overallUser = ($review->rating_gameplay + $review->rating_story + $review->rating_visual) / 3;
        $review->update(['rating_overall' => round($overallUser, 1)]);

        $this->updateGameAverages($review->game_id);

        return response()->json(['message' => 'Review updated']);
    }

    public function destroy(Request $request, $id)
    {
        $review = Review::find($id);
        if (!$review) {
            return response()->json(['message' => 'Review tidak ditemukan.'], 404);
        }

        if ($review->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        $gameId = $review->game_id;
        $review->delete();
        $this->updateGameAverages($gameId);

        return response()->json(['message' => 'Deleted']);
    }

    private function updateGameAverages($gameId)
    {
        $game = Game::find($gameId);

        $stats = Review::where('game_id', $gameId)
            ->select(
                DB::raw('AVG(rating_gameplay) as avg_gp'),
                DB::raw('AVG(rating_story) as avg_st'),
                DB::raw('AVG(rating_visual) as avg_vi'),
                DB::raw('AVG(rating_overall) as avg_ov'),
                DB::raw('COUNT(id) as total')
            )->first();

        $game->update([
            'avg_gameplay'  => round($stats->avg_gp ?? 0, 1),
            'avg_story'     => round($stats->avg_st ?? 0, 1),
            'avg_visual'    => round($stats->avg_vi ?? 0, 1),
            'avg_overall'   => round($stats->avg_ov ?? 0, 1),
            'total_reviews' => $stats->total,
        ]);
    }

    public function toggleHelpful(Request $request, $reviewId)
    {
        $review = Review::find($reviewId);
        if (!$review) {
            return response()->json(['message' => 'Review tidak ditemukan.'], 404);
        }

        $userId = $request->user()->id;
        $vote = ReviewHelpfulVote::where('user_id', $userId)
            ->where('review_id', $reviewId)
            ->first();

        if ($vote) {
            $vote->delete();
            $isHelpful = false;
        } else {
            ReviewHelpfulVote::create(['user_id' => $userId, 'review_id' => $reviewId]);
            $isHelpful = true;
        }

        return response()->json([
            'message'       => $isHelpful ? 'Ditandai helpful.' : 'Batal helpful.',
            'is_helpful'    => $isHelpful,
            'helpful_count' => $review->helpfulVotes()->count(),
        ]);
    }    
}