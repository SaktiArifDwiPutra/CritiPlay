<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function getByGame($gameId)
    {
        $reviews = Review::where('game_id', $gameId)->orderBy('created_at', 'desc')->get()->map(function($review) {
            return [
                'id' => (string) $review->id,
                'gameId' => (string) $review->game_id,
                'status' => $review->status,
                'aspectRatings' => $review->aspect_ratings,
                'overallRating' => $review->overall_rating,
                'content' => $review->content,
                'dateAdded' => $review->created_at->toISOString(),
            ];
        });
        return response()->json($reviews);
    }

    public function store(Request $request)
    {
        $review = Review::create([
            'game_id' => $request->input('gameId'),
            'status' => $request->input('status'),
            'aspect_ratings' => $request->input('aspectRatings'),
            'overall_rating' => $request->input('overallRating'),
            'content' => $request->input('content'),
        ]);
        
        return response()->json(['message' => 'Review created', 'id' => (string) $review->id], 201);
    }

    public function update(Request $request, $id)
    {
        $review = Review::find($id);
        if (!$review) return response()->json(['message' => 'Not found'], 404);

        $review->update([
            'status' => $request->input('status', $review->status),
            'aspect_ratings' => $request->input('aspectRatings', $review->aspect_ratings),
            'overall_rating' => $request->input('overallRating', $review->overall_rating),
            'content' => $request->input('content', $review->content), // <-- Ini solusinya
        ]);

        return response()->json(['message' => 'Review updated']);
    }

    public function destroy($id)
    {
        $review = Review::find($id);
        if ($review) $review->delete();
        return response()->json(['message' => 'Deleted']);
    }
}