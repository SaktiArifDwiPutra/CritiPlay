<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Services\IgdbService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class GameController extends Controller
{
    // Daftar semua game (data global, bukan milik user tertentu)
    public function index(Request $request)
    {
        $games = Game::orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($game) => $this->formatGame($game));

        return response()->json($games);
    }

    // Detail satu game
    public function show($id)
    {
        $game = Game::find($id);

        if (!$game) {
            return response()->json(['message' => 'Game tidak ditemukan.'], 404);
        }

        return response()->json($this->formatGame($game));
    }

    // Update (misalnya perbaikan data manual, opsional)
    public function update(Request $request, $id)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak. Anda bukan Admin.'], 403);
        }

        $game = Game::find($id);

        if (!$game) {
            return response()->json(['message' => 'Game tidak ditemukan.'], 404);
        }

        $game->update([
            'name'         => $request->name ?? $game->name,
            'cover_url'    => $request->cover_url ?? $game->cover_url,
            'release_year' => $request->release_year ?? $game->release_year,
            'genres'       => $request->genres ?? $game->genres,
            'platforms'    => $request->platforms ?? $game->platforms,
            'summary'      => $request->summary ?? $game->summary,
        ]);

        return response()->json(['message' => 'Game updated', 'game' => $this->formatGame($game)]);
    }

    // Delete
    public function destroy(Request $request, $id)
    {
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak. Anda bukan Admin.'], 403);
        }

        $game = Game::find($id);

        if (!$game) {
            return response()->json(['message' => 'Game tidak ditemukan.'], 404);
        }

        $game->delete();

        return response()->json(['message' => 'Deleted']);
    }

    // Top rated (fitur "Gameplay Terbaik" dkk yang kita rencanain)
    public function topRated(Request $request)
    {
        $type = $request->query('type', 'overall');

        $column = match ($type) {
            'gameplay' => 'avg_gameplay',
            'story'    => 'avg_story',
            'visual'   => 'avg_visual',
            default    => 'avg_overall',
        };

        $games = Game::where('total_reviews', '>', 0)
            ->orderByDesc($column)
            ->limit(10)
            ->get()
            ->map(fn ($game) => $this->formatGame($game));

        return response()->json($games);
    }

    // Top rated summary (menggabungkan 4 kategori dalam 1 request)
    public function topRatedSummary()
    {
        $columns = [
            'overall'  => 'avg_overall',
            'gameplay' => 'avg_gameplay',
            'story'    => 'avg_story',
            'visual'   => 'avg_visual',
        ];

        $result = [];
        foreach ($columns as $key => $column) {
            $result[$key] = Game::where('total_reviews', '>', 0)
                ->orderByDesc($column)
                ->limit(10)
                ->get()
                ->map(fn ($game) => $this->formatGame($game));
        }

        return response()->json($result);
    }

    // Rekomendasi game dari IGDB dengan caching 12 jam
    public function recommendations(Request $request, IgdbService $igdb)
    {
        $limit = (int) $request->query('limit', 24);
        if ($limit < 1 || $limit > 50) {
            $limit = 24;
        }

        $forceRefresh = $request->boolean('refresh');

        $pool = Cache::get('igdb_recommendations_pool');

        if (!$pool || $forceRefresh) {
            $pool = $this->fetchRecommendationsFromIgdb($igdb);

            if (!empty($pool)) {
                Cache::put('igdb_recommendations_pool', $pool, now()->addHours(12));
            }
        }

        // Fallback jika IGDB gagal: ambil acak dari database lokal
        if (empty($pool)) {
            $fallback = Game::inRandomOrder()->limit($limit)->get();
            return response()->json($fallback->map(fn ($g) => $this->formatGame($g)));
        }

        // Acak pool setiap kali dipanggil agar rekomendasi bervariasi
        $selected = collect($pool)->shuffle()->slice(0, $limit)->values();

        // Cek game yang sudah ada di database lokal agar rating dan review lokal muncul
        $igdbIds = $selected->pluck('igdb_id')->filter()->all();
        $dbGames = !empty($igdbIds)
            ? Game::whereIn('igdb_id', $igdbIds)->get()->keyBy('igdb_id')
            : collect();

        $formatted = $selected->map(function ($item) use ($dbGames) {
            $igdbId = $item['igdb_id'] ?? null;
            if ($igdbId && isset($dbGames[$igdbId])) {
                return $this->formatGame($dbGames[$igdbId]);
            }
            return [
                'igdb_id'      => $item['igdb_id'] ?? 0,
                'name'         => $item['name'] ?? 'Unknown',
                'cover_url'    => $item['cover_url'] ?? null,
                'release_year' => $item['release_year'] ?? null,
                'genres'       => $item['genres'] ?? [],
                'platforms'    => $item['platforms'] ?? [],
            ];
        });

        return response()->json($formatted);
    }

    private function fetchRecommendationsFromIgdb(IgdbService $igdb): array
    {
        $seeds = [
            'quest', 'legend', 'dark', 'world', 'night', 'star', 'dragon', 'city',
            'racing', 'soul', 'hero', 'ghost', 'blade', 'farm', 'war', 'sky',
            'craft', 'tale', 'dead', 'hunter', 'kingdom', 'shadow', 'space', 'survival'
        ];
        shuffle($seeds);
        $chosen = array_slice($seeds, 0, 3);

        $pool = [];
        $seen = [];

        foreach ($chosen as $seed) {
            try {
                $body = 'search "' . $seed . '"; fields name, cover.image_id, first_release_date, genres.name, platforms.name; limit 16;';
                $response = $igdb->request('games', $body);

                if ($response->successful()) {
                    $games = $response->json();
                    foreach ($games as $game) {
                        $id = $game['id'] ?? null;
                        if (!$id || isset($seen[$id]) || !isset($game['cover']['image_id'])) {
                            continue;
                        }
                        $seen[$id] = true;
                        $pool[] = [
                            'igdb_id'      => $id,
                            'name'         => $game['name'] ?? 'Unknown',
                            'cover_url'    => 'https://images.igdb.com/igdb/image/upload/t_cover_big/' . $game['cover']['image_id'] . '.jpg',
                            'release_year' => isset($game['first_release_date']) ? date('Y', $game['first_release_date']) : null,
                            'genres'       => isset($game['genres']) ? collect($game['genres'])->pluck('name')->values()->all() : [],
                            'platforms'    => isset($game['platforms']) ? collect($game['platforms'])->pluck('name')->values()->all() : [],
                        ];
                    }
                }
            } catch (\Exception $e) {
                Log::warning('IGDB recommendation fetch error: ' . $e->getMessage());
            }
        }

        return $pool;
    }

    private function formatGame(Game $game): array
    {
        return [
            'id'           => (string) $game->id,
            'igdb_id'      => $game->igdb_id,
            'igdbId'       => $game->igdb_id,
            'name'         => $game->name,
            'cover_url'    => $game->cover_url,
            'coverUrl'     => $game->cover_url,
            'release_year' => $game->release_year,
            'releaseYear'  => $game->release_year,
            'genres'       => $game->genres ?? [],
            'platforms'    => $game->platforms ?? [],
            'summary'      => $game->summary,
            'avgGameplay'  => (float) $game->avg_gameplay,
            'avgStory'     => (float) $game->avg_story,
            'avgVisual'    => (float) $game->avg_visual,
            'avgOverall'   => (float) $game->avg_overall,
            'totalReviews' => (int) $game->total_reviews,
        ];
    }
}