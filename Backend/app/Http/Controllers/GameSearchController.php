<?php

namespace App\Http\Controllers;

use App\Services\IgdbService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GameSearchController extends Controller
{
    protected $igdb;

    public function __construct(IgdbService $igdb)
    {
        $this->igdb = $igdb;
    }

    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2'
        ]);

        $query = $request->q;

        $body = 'search "' . $query . '"; fields name, cover.image_id, first_release_date, genres.name, platforms.name; limit 12;';

        try {
            $response = $this->igdb->request('games', $body);

            if ($response->failed()) {
                return response()->json([
                    'message' => 'Gagal mengambil data dari IGDB'
                ], 500);
            }

            $games = $response->json();

            $formattedGames = collect($games)->map(function ($game) {
                return [
                    'igdb_id' => $game['id'] ?? null,
                    'name' => $game['name'] ?? 'Unknown',
                    'cover_url' => isset($game['cover']['image_id'])
                        ? 'https://images.igdb.com/igdb/image/upload/t_cover_big/' . $game['cover']['image_id'] . '.jpg'
                        : null,
                    'release_year' => isset($game['first_release_date'])
                        ? date('Y', $game['first_release_date'])
                        : 'Unknown',
                    'genres' => isset($game['genres'])
                        ? collect($game['genres'])->pluck('name')->values()
                        : [],
                    'platforms' => isset($game['platforms'])
                        ? collect($game['platforms'])->pluck('name')->values()
                        : [],
                ];
            });

            return response()->json($formattedGames);

        } catch (\Exception $e) {
            Log::error('Game Search Error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Terjadi kesalahan server saat mencari game.'
            ], 500);
        }
    }
}