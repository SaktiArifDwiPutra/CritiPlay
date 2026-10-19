<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Services\IgdbService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GameImportController extends Controller
{
    protected $igdb;

    public function __construct(IgdbService $igdb)
    {
        $this->igdb = $igdb;
    }

    public function import(Request $request)
    {
        $request->validate([
            'igdb_id' => 'required|integer'
        ]);

        $igdbId = $request->igdb_id;

        $game = Game::where('igdb_id', $igdbId)->first();

        if (!$game) {
            $body = 'fields name, cover.image_id, first_release_date, genres.name, platforms.name, summary; where id = ' . $igdbId . '; limit 1;';

            try {
                $response = $this->igdb->request('games', $body);

                if ($response->failed() || empty($response->json())) {
                    return response()->json([
                        'message' => 'Game tidak ditemukan di IGDB.'
                    ], 404);
                }

                $data = $response->json()[0];

                $game = Game::create([
                    'igdb_id' => $data['id'],
                    'name' => $data['name'] ?? 'Unknown',
                    'cover_url' => isset($data['cover']['image_id'])
                        ? 'https://images.igdb.com/igdb/image/upload/t_cover_big/' . $data['cover']['image_id'] . '.jpg'
                        : null,
                    'release_year' => isset($data['first_release_date'])
                        ? date('Y', $data['first_release_date'])
                        : null,
                    'genres' => isset($data['genres'])
                        ? collect($data['genres'])->pluck('name')->values()
                        : [],
                    'platforms' => isset($data['platforms'])
                        ? collect($data['platforms'])->pluck('name')->values()
                        : [],
                    'summary' => $data['summary'] ?? null,
                ]);
} catch (\Exception $e) {
                Log::error('Import IGDB Error: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Gagal import dari IGDB.'
                ], 500);
            }
        }

        return response()->json([
            'message' => 'Berhasil!',
            'game' => $game
        ], 200);
    }
}