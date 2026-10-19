<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\IgdbService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class SensitiveDataProtectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_serialization_hides_otp_and_sensitive_fields(): void
    {
        $user = User::factory()->create([
            'email'          => 'secret@critiplay.test',
            'otp'            => '888888',
            'otp_expires_at' => Carbon::now()->addMinutes(10),
            'google_id'      => 'google-uid-12345',
        ]);

        $serialized = $user->toArray();

        $this->assertArrayNotHasKey('otp', $serialized);
        $this->assertArrayNotHasKey('otp_expires_at', $serialized);
        $this->assertArrayNotHasKey('google_id', $serialized);
        $this->assertArrayNotHasKey('password', $serialized);
    }

    public function test_admin_get_all_users_does_not_expose_otp_or_google_id(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->create([
            'otp'       => '777777',
            'google_id' => 'google-uid-99999',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/users');
        $response->assertStatus(200);

        $response->assertJsonMissing(['otp' => '777777']);
        $response->assertJsonMissing(['google_id' => 'google-uid-99999']);
    }

    public function test_game_import_error_does_not_leak_internal_exception_details(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        Sanctum::actingAs($user);

        // Mock IgdbService to throw an exception
        $mockIgdb = Mockery::mock(IgdbService::class);
        $mockIgdb->shouldReceive('request')
            ->andThrow(new \Exception('Sensitive DB query failed with credentials'));
        $this->app->instance(IgdbService::class, $mockIgdb);

        $response = $this->postJson('/api/games/import', [
            'igdb_id' => 9999999,
        ]);

        $response->assertStatus(500);
        $response->assertJson(['message' => 'Gagal import dari IGDB.']);
        $response->assertJsonMissingPath('error_asli');
        $response->assertJsonMissingPath('di_baris');
    }

    public function test_game_search_error_does_not_leak_internal_exception_message(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        Sanctum::actingAs($user);

        // Mock IgdbService to throw an exception
        $mockIgdb = Mockery::mock(IgdbService::class);
        $mockIgdb->shouldReceive('request')
            ->andThrow(new \Exception('Internal API connection timeout to 10.0.0.1'));
        $this->app->instance(IgdbService::class, $mockIgdb);

        $response = $this->getJson('/api/games/search?q=zelda');

        $response->assertStatus(500);
        $response->assertJson(['message' => 'Terjadi kesalahan server saat mencari game.']);
        $this->assertStringNotContainsString('10.0.0.1', $response->getContent());
    }
}
