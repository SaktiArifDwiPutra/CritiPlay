<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReviewAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private User $stranger;
    private User $admin;
    private Game $game;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create([
            'role' => 'user',
        ]);

        $this->stranger = User::factory()->create([
            'role' => 'user',
        ]);

        $this->admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->game = Game::create([
            'igdb_id'      => 99991,
            'name'         => 'Test Game',
            'release_year' => '2024',
        ]);
    }

    public function test_user_cannot_update_another_users_review(): void
    {
        $review = Review::create([
            'user_id'         => $this->owner->id,
            'game_id'         => $this->game->id,
            'rating_gameplay' => 8,
            'rating_story'    => 8,
            'rating_visual'   => 8,
            'rating_overall'  => 8.0,
            'review_text'     => 'Original review',
        ]);

        Sanctum::actingAs($this->stranger);

        $response = $this->putJson("/api/reviews/{$review->id}", [
            'rating_gameplay' => 2,
            'review_text'     => 'Hacked review',
        ]);

        $response->assertStatus(403);
        $response->assertJson(['message' => 'Tidak diizinkan.']);

        $review->refresh();
        $this->assertEquals('Original review', $review->review_text);
    }

    public function test_user_cannot_delete_another_users_review(): void
    {
        $review = Review::create([
            'user_id'         => $this->owner->id,
            'game_id'         => $this->game->id,
            'rating_gameplay' => 8,
            'rating_story'    => 8,
            'rating_visual'   => 8,
            'rating_overall'  => 8.0,
            'review_text'     => 'Original review',
        ]);

        Sanctum::actingAs($this->stranger);

        $response = $this->deleteJson("/api/reviews/{$review->id}");

        $response->assertStatus(403);
        $response->assertJson(['message' => 'Tidak diizinkan.']);

        $this->assertDatabaseHas('reviews', ['id' => $review->id]);
    }

    public function test_owner_can_update_their_own_review(): void
    {
        $review = Review::create([
            'user_id'         => $this->owner->id,
            'game_id'         => $this->game->id,
            'rating_gameplay' => 8,
            'rating_story'    => 8,
            'rating_visual'   => 8,
            'rating_overall'  => 8.0,
            'review_text'     => 'Original review',
        ]);

        Sanctum::actingAs($this->owner);

        $response = $this->putJson("/api/reviews/{$review->id}", [
            'rating_gameplay' => 9,
            'review_text'     => 'Updated by owner',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Review updated']);

        $review->refresh();
        $this->assertEquals('Updated by owner', $review->review_text);
    }

    public function test_owner_can_delete_their_own_review(): void
    {
        $review = Review::create([
            'user_id'         => $this->owner->id,
            'game_id'         => $this->game->id,
            'rating_gameplay' => 8,
            'rating_story'    => 8,
            'rating_visual'   => 8,
            'rating_overall'  => 8.0,
            'review_text'     => 'Original review',
        ]);

        Sanctum::actingAs($this->owner);

        $response = $this->deleteJson("/api/reviews/{$review->id}");

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Deleted']);

        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
    }

    public function test_admin_can_delete_any_review(): void
    {
        $review = Review::create([
            'user_id'         => $this->owner->id,
            'game_id'         => $this->game->id,
            'rating_gameplay' => 8,
            'rating_story'    => 8,
            'rating_visual'   => 8,
            'rating_overall'  => 8.0,
            'review_text'     => 'Original review',
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->deleteJson("/api/reviews/{$review->id}");

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Deleted']);

        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
    }
}
