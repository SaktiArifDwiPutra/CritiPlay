<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GameAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private User $regularUser;
    private User $adminUser;
    private Game $game;

    protected function setUp(): void
    {
        parent::setUp();

        $this->regularUser = User::factory()->create([
            'role' => 'user',
        ]);

        $this->adminUser = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->game = Game::create([
            'igdb_id'      => 12345,
            'name'         => 'Original Game Title',
            'release_year' => '2025',
            'summary'      => 'A great adventure',
        ]);
    }

    public function test_regular_user_can_view_games_list_and_detail(): void
    {
        Sanctum::actingAs($this->regularUser);

        $listResponse = $this->getJson('/api/games');
        $listResponse->assertStatus(200);

        $detailResponse = $this->getJson("/api/games/{$this->game->id}");
        $detailResponse->assertStatus(200);
        $detailResponse->assertJsonFragment(['name' => 'Original Game Title']);
    }

    public function test_regular_user_cannot_update_game(): void
    {
        Sanctum::actingAs($this->regularUser);

        $response = $this->putJson("/api/games/{$this->game->id}", [
            'name' => 'Defaced Title',
        ]);

        $response->assertStatus(403);
        $response->assertJson(['message' => 'Akses ditolak. Anda bukan Admin.']);

        $this->game->refresh();
        $this->assertEquals('Original Game Title', $this->game->name);
    }

    public function test_regular_user_cannot_delete_game(): void
    {
        Sanctum::actingAs($this->regularUser);

        $response = $this->deleteJson("/api/games/{$this->game->id}");

        $response->assertStatus(403);
        $response->assertJson(['message' => 'Akses ditolak. Anda bukan Admin.']);

        $this->assertDatabaseHas('games', ['id' => $this->game->id]);
    }

    public function test_post_to_games_is_not_allowed(): void
    {
        Sanctum::actingAs($this->regularUser);

        $response = $this->postJson('/api/games', [
            'name' => 'Arbitrary Game',
        ]);

        $response->assertStatus(405);
    }

    public function test_admin_can_update_game(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->putJson("/api/games/{$this->game->id}", [
            'name' => 'Updated Game Title by Admin',
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'Updated Game Title by Admin']);

        $this->game->refresh();
        $this->assertEquals('Updated Game Title by Admin', $this->game->name);
    }

    public function test_admin_can_delete_game(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->deleteJson("/api/games/{$this->game->id}");

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Deleted']);

        $this->assertDatabaseMissing('games', ['id' => $this->game->id]);
    }
}
