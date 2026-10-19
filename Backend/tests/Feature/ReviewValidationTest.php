<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Review;
use App\Models\Game;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ReviewValidationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_validates_rating_fields_when_updating_review()
    {
        // Create a user and authenticate
        $user = User::factory()->create();
        $this->actingAs($user);

        // Create a game and a review for the user
        $game = Game::factory()->create();
        $review = Review::create([
            'user_id' => $user->id,
            'game_id' => $game->id,
            'rating_gameplay' => 8,
            'rating_story' => 7,
            'rating_visual' => 9,
            'rating_overall' => 8,
            'review_text' => 'Initial review',
        ]);

        // Attempt to update with invalid rating (out of range)
        $response = $this->json('PUT', "/api/reviews/{$review->id}", [
            'rating_gameplay' => 0, // below min
            'rating_story' => 11,   // above max
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['rating_gameplay', 'rating_story']);
    }

    /** @test */
    public function it_allows_valid_rating_updates()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        $game = Game::factory()->create();
        $review = Review::create([
            'user_id' => $user->id,
            'game_id' => $game->id,
            'rating_gameplay' => 5,
            'rating_story' => 5,
            'rating_visual' => 5,
            'rating_overall' => 5,
            'review_text' => 'Old text',
        ]);

        $response = $this->json('PUT', "/api/reviews/{$review->id}", [
            'rating_gameplay' => 9,
            'rating_story' => 8,
            'rating_visual' => 7,
            'review_text' => 'Updated review',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('reviews', [
            'id' => $review->id,
            'rating_gameplay' => 9,
            'rating_story' => 8,
            'rating_visual' => 7,
            'review_text' => 'Updated review',
        ]);
    }
}
