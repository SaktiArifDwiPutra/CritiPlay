<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatisticsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // 1. Personal Library Statistics
        $libraryItems = DB::table('game_user')
            ->where('user_id', $user->id)
            ->join('games', 'game_user.game_id', '=', 'games.id')
            ->select('game_user.status', 'games.id as game_id', 'games.name', 'games.genres', 'games.platforms', 'games.cover_url')
            ->get();

        $statusCounts = [
            'completed'    => 0,
            'playing'      => 0,
            'plan_to_play' => 0,
            'dropped'      => 0,
        ];
        $genreCounts = [];
        $platformCounts = [];

        foreach ($libraryItems as $item) {
            if (isset($statusCounts[$item->status])) {
                $statusCounts[$item->status]++;
            }
            $genres = json_decode($item->genres, true) ?: [];
            foreach ($genres as $g) {
                if (is_string($g) && $g !== '') {
                    $genreCounts[$g] = ($genreCounts[$g] ?? 0) + 1;
                }
            }
            $platforms = json_decode($item->platforms, true) ?: [];
            foreach ($platforms as $p) {
                if (is_string($p) && $p !== '') {
                    $platformCounts[$p] = ($platformCounts[$p] ?? 0) + 1;
                }
            }
        }
        arsort($genreCounts);
        arsort($platformCounts);

        $topGenres = [];
        foreach (array_slice($genreCounts, 0, 5, true) as $genre => $count) {
            $topGenres[] = ['name' => $genre, 'count' => $count];
        }

        $topPlatforms = [];
        foreach (array_slice($platformCounts, 0, 5, true) as $platform => $count) {
            $topPlatforms[] = ['name' => $platform, 'count' => $count];
        }

        $totalLib = count($libraryItems);
        $completionRate = $totalLib > 0 ? round(($statusCounts['completed'] / $totalLib) * 100, 1) : 0;

        // 2. Personal Review Statistics
        $userReviews = Review::where('user_id', $user->id)->get();
        $reviewCount = $userReviews->count();
        $userReviewIds = $userReviews->pluck('id');
        $helpfulVotes = DB::table('review_helpful_votes')->whereIn('review_id', $userReviewIds)->count();

        $personalAvg = [
            'gameplay' => $reviewCount > 0 ? round((float) $userReviews->avg('rating_gameplay'), 1) : 0,
            'story'    => $reviewCount > 0 ? round((float) $userReviews->avg('rating_story'), 1) : 0,
            'visual'   => $reviewCount > 0 ? round((float) $userReviews->avg('rating_visual'), 1) : 0,
            'overall'  => $reviewCount > 0 ? round((float) $userReviews->avg('rating_overall'), 1) : 0,
        ];

        $highestRated = Review::where('user_id', $user->id)
            ->with('game')
            ->orderByDesc('rating_overall')
            ->limit(3)
            ->get()
            ->map(fn ($r) => [
                'id'              => (string) $r->game_id,
                'name'            => $r->game?->name ?? 'Unknown',
                'cover_url'       => $r->game?->cover_url,
                'rating_overall'  => (float) $r->rating_overall,
                'rating_gameplay' => (float) $r->rating_gameplay,
                'rating_story'    => (float) $r->rating_story,
                'rating_visual'   => (float) $r->rating_visual,
                'review_text'     => $r->review_text,
            ]);

        // 3. Global Community Statistics
        $totalGames = Game::count();
        $reviewedGamesCount = Game::where('total_reviews', '>', 0)->count();
        $totalReviews = Review::count();
        $activePlayers = DB::table('game_user')
            ->whereIn('status', ['playing', 'completed'])
            ->distinct('user_id')
            ->count('user_id');

        $communityAverages = [
            'gameplay' => round((float) (Review::avg('rating_gameplay') ?? 0), 1),
            'story'    => round((float) (Review::avg('rating_story') ?? 0), 1),
            'visual'   => round((float) (Review::avg('rating_visual') ?? 0), 1),
            'overall'  => round((float) (Review::avg('rating_overall') ?? 0), 1),
        ];

        $formatLeader = function (?Game $game, string $scoreField) {
            if (!$game) return null;
            return [
                'id'           => (string) $game->id,
                'name'         => $game->name,
                'cover_url'    => $game->cover_url,
                'score'        => (float) $game->{$scoreField},
                'totalReviews' => (int) $game->total_reviews,
            ];
        };

        $aspectLeaders = [
            'gameplay' => $formatLeader(Game::where('total_reviews', '>', 0)->orderByDesc('avg_gameplay')->first(), 'avg_gameplay'),
            'story'    => $formatLeader(Game::where('total_reviews', '>', 0)->orderByDesc('avg_story')->first(), 'avg_story'),
            'visual'   => $formatLeader(Game::where('total_reviews', '>', 0)->orderByDesc('avg_visual')->first(), 'avg_visual'),
            'overall'  => $formatLeader(Game::where('total_reviews', '>', 0)->orderByDesc('avg_overall')->first(), 'avg_overall'),
        ];

        $ratingDist = [
            ['range' => '9.0 - 10', 'count' => Review::where('rating_overall', '>=', 9)->count()],
            ['range' => '8.0 - 8.9', 'count' => Review::whereBetween('rating_overall', [8, 8.99])->count()],
            ['range' => '7.0 - 7.9', 'count' => Review::whereBetween('rating_overall', [7, 7.99])->count()],
            ['range' => '6.0 - 6.9', 'count' => Review::whereBetween('rating_overall', [6, 6.99])->count()],
            ['range' => '< 6.0',     'count' => Review::where('rating_overall', '<', 6)->count()],
        ];

        // Community Most Reviewed Games
        $mostReviewedCommunity = Game::where('total_reviews', '>', 0)
            ->orderByDesc('total_reviews')
            ->limit(4)
            ->get()
            ->map(fn ($g) => [
                'id'           => (string) $g->id,
                'name'         => $g->name,
                'cover_url'    => $g->cover_url,
                'avg_overall'  => (float) $g->avg_overall,
                'totalReviews' => (int) $g->total_reviews,
            ]);

        return response()->json([
            'personal' => [
                'library' => [
                    'total'           => $totalLib,
                    'completed'       => $statusCounts['completed'],
                    'playing'         => $statusCounts['playing'],
                    'plan_to_play'    => $statusCounts['plan_to_play'],
                    'dropped'         => $statusCounts['dropped'],
                    'completion_rate' => $completionRate,
                ],
                'reviews' => [
                    'count'                  => $reviewCount,
                    'helpful_votes_received' => $helpfulVotes,
                    'averages'               => $personalAvg,
                ],
                'top_genres'           => $topGenres,
                'top_platforms'        => $topPlatforms,
                'highest_rated_games'  => $highestRated,
            ],
            'community' => [
                'overview' => [
                    'total_catalog_games'  => $totalGames,
                    'total_reviewed_games' => $reviewedGamesCount,
                    'total_reviews'        => $totalReviews,
                    'total_active_players' => $activePlayers,
                ],
                'aspect_leaders'      => $aspectLeaders,
                'aspect_averages'     => $communityAverages,
                'rating_distribution' => $ratingDist,
                'most_reviewed_games' => $mostReviewedCommunity,
            ]
        ]);
    }
}
