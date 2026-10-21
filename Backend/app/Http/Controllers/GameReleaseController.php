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
                now()->addHour(),
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