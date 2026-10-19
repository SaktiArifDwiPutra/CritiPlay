<?php

namespace App\Http\Controllers;

use App\Models\Game;
use Illuminate\Http\Request;

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

    private function formatGame(Game $game): array
    {
        return [
            'id'           => (string) $game->id,
            'igdbId'       => $game->igdb_id,
            'name'         => $game->name,
            'coverUrl'     => $game->cover_url,
            'releaseYear'  => $game->release_year,
            'genres'       => $game->genres,
            'platforms'    => $game->platforms,
            'summary'      => $game->summary,
            'avgGameplay'  => $game->avg_gameplay,
            'avgStory'     => $game->avg_story,
            'avgVisual'    => $game->avg_visual,
            'avgOverall'   => $game->avg_overall,
            'totalReviews' => $game->total_reviews,
        ];
    }
}