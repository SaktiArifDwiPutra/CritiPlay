<?php

namespace App\Http\Controllers;

use App\Models\Game;
use Illuminate\Http\Request;

class GameController extends Controller
{
    // Hanya ambil data milik user login
    public function index(Request $request)
    {
        $games = Game::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($game) {
                return [
                    'id' => (string) $game->id,
                    'title' => $game->title,
                    'coverImage' => $game->cover_image,
                    'developer' => $game->developer,
                    'releaseDate' => $game->release_date,
                    'genres' => $game->genres,
                ];
            });
            
        return response()->json($games);
    }

    // Create
    public function store(Request $request)
    {
        $game = Game::create([
            'user_id' => $request->user()->id, 
            'title' => $request->title,
            'cover_image' => $request->coverImage,
            'developer' => $request->developer,
            'release_date' => $request->releaseDate,
            'genres' => $request->genres,
        ]);

        return response()->json(['message' => 'Game created', 'id' => (string) $game->id], 201);
    }

    // Read (pastikan data yag dicari adalah milik user)
    public function show(Request $request, $id)
    {
        $game = Game::where('id', $id)->where('user_id', $request->user()->id)->first();

        if (!$game) return response()->json(['message' => 'Not found or unauthorized'], 404);
        return response()->json([
            'id' => (string) $game->id,
            'title' => $game->title,
            'coverImage' => $game->cover_image,
            'developer' => $game->developer,
            'releaseDate' => $game->release_date,
            'genres' => $game->genres,
        ]);
    }

    // Update
    public function update(Request $request, $id)
    {
        $game = Game::where('id', $id)->where('user_id', $request->user()->id)->first();
        
        if (!$game) return response()->json(['message' => 'Not found or unauthorized'], 404);

        $game->update([
            'title' => $request->title ?? $game->title,
            'cover_image' => $request->coverImage ?? $game->cover_image,
            'developer' => $request->developer ?? $game->developer,
            'release_date' => $request->releaseDate ?? $game->release_date,
            'genres' => $request->genres ?? $game->genres,
        ]);

        return response()->json(['message' => 'Game updated']);
    }

    // Delete
    public function destroy(Request $request, $id)
    {
        $game = Game::where('id', $id)->where('user_id', $request->user()->id)->first();
        
        if ($game) {
            $game->delete();
            return response()->json(['message' => 'Deleted']);
        }
        
        return response()->json(['message' => 'Not found or unauthorized'], 404);
    }
}