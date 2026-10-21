<?php

namespace App\Http\Controllers;

use App\Services\IgdbService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class GameReleaseController extends Controller
{
    private const FIELDS = 'id,name,cover.image_id,first_release_date,hypes,genres.name,platforms.name';

    public function summary(Request $request, IgdbService $igdb): JsonResponse
    {
        $recentLimit = min(max((int) $request->query('recent_limit', 5), 1), 20);
        $upcomingLimit = min(max((int) $request->query('upcoming_limit', 7), 1), 20);
        $anticipatedLimit = min(max((int) $request->query('anticipated_limit', 5), 1), 20);

        $cacheKey = "igdb.releases.summary.{$recentLimit}_{$upcomingLimit}_{$anticipatedLimit}";

        try {
            $data = Cache::remember(
                $cacheKey,
                now()->addHours(12),
                function () use ($igdb, $recentLimit, $upcomingLimit, $anticipatedLimit) {
                    $now = now()->timestamp;
                    $base = 'cover != null & game_type = (0,8,9)';

                    $queries = [
                        'recent' => [
                            'endpoint' => 'games',
                            'body' => 'fields ' . self::FIELDS . '; where first_release_date <= ' . $now
                                . ' & first_release_date >= ' . now()->subDays(90)->timestamp
                                . " & {$base}; sort first_release_date desc; limit {$recentLimit};",
                        ],
                        'upcoming' => [
                            'endpoint' => 'games',
                            'body' => 'fields ' . self::FIELDS . '; where first_release_date > ' . $now
                                . ' & first_release_date <= ' . now()->addDays(120)->timestamp
                                . " & {$base}; sort first_release_date asc; limit {$upcomingLimit};",
                        ],
                        'anticipated' => [
                            'endpoint' => 'games',
                            'body' => 'fields ' . self::FIELDS . '; where first_release_date > ' . $now
                                . " & hypes > 0 & {$base}; sort hypes desc; limit {$anticipatedLimit};",
                        ],
                    ];

                    $keys = array_keys($queries);
                    $responses = $igdb->poolRequests(array_values($queries));

                    $result = [];
                    foreach ($keys as $i => $type) {
                        $resp = $responses[$i] ?? null;
                        if ($resp && $resp->successful()) {
                            $result[$type] = collect($resp->json())
                                ->map(fn ($game) => $this->format($game))
                                ->values()
                                ->all();
                        } else {
                            $result[$type] = [];
                        }
                    }

                    return $result;
                }
            );
        } catch (Throwable $e) {
            Log::error('Gagal mengambil summary rilis IGDB: ' . $e->getMessage());

            return response()->json([
                'recent' => [],
                'upcoming' => [],
                'anticipated' => [],
            ]);
        }

        return response()->json($data);
    }

    public function index(Request $request, IgdbService $igdb, string $type): JsonResponse
    {
        $limit = min(max((int) $request->query('limit', 10), 1), 20);
        $now = now()->timestamp;
        $base = 'cover != null & game_type = (0,8,9)';

        $filter = match ($type) {
            'recent' => 'where first_release_date <= '.$now
                .' & first_release_date >= '.now()->subDays(90)->timestamp
                ." & {$base}; sort first_release_date desc;",
            'upcoming' => 'where first_release_date > '.$now
                .' & first_release_date <= '.now()->addDays(120)->timestamp
                ." & {$base}; sort first_release_date asc;",
            'anticipated' => 'where first_release_date > '.$now
                ." & hypes > 0 & {$base}; sort hypes desc;",
        };

        $body = 'fields '.self::FIELDS.'; '.$filter." limit {$limit};";

        try {
            $games = Cache::remember(
                "igdb.releases.{$type}.{$limit}",
                now()->addHours(12),
                function () use ($igdb, $body) {
                    $response = $igdb->request('games', $body);

                    if ($response->failed()) {
                        throw new RuntimeException(
                            'IGDB error '.$response->status().': '.$response->body()
                        );
                    }

                    return collect($response->json())
                        ->map(fn ($game) => $this->format($game))
                        ->values()
                        ->all();
                }
            );
        } catch (Throwable $e) {
            Log::error('Gagal mengambil rilis IGDB: '.$e->getMessage());

            return response()->json(
                ['message' => 'Gagal mengambil data rilis dari IGDB.'],
                500
            );
        }

        return response()->json($games);
    }

    private function format(array $game): array
    {
        $date = isset($game['first_release_date'])
            ? Carbon::createFromTimestamp($game['first_release_date'])
            : null;

        return [
            'igdb_id' => $game['id'],
            'name' => $game['name'],
            'cover_url' => isset($game['cover']['image_id'])
                ? "https://images.igdb.com/igdb/image/upload/t_cover_big/{$game['cover']['image_id']}.jpg"
                : null,
            'release_date' => $date?->toDateString(),
            'release_year' => $date ? (string) $date->year : null,
            'hypes' => $game['hypes'] ?? 0,
            'genres' => collect($game['genres'] ?? [])->pluck('name')->values()->all(),
            'platforms' => collect($game['platforms'] ?? [])->pluck('name')->values()->all(),
        ];
    }
}