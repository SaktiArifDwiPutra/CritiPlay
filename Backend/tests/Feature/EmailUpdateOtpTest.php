<?php

namespace Tests\Feature;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EmailUpdateOtpTest extends TestCase
{
    use RefreshDatabase;

    public function test_update_profile_without_changing_email_preserves_verification(): void
    {
        $verifiedAt = Carbon::now()->subDays(5);
        $user = User::factory()->create([
            'email'             => 'original@critiplay.test',
            'name'              => 'Original Name',
            'email_verified_at' => $verifiedAt,
            'otp'               => null,
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/profile', [
            'name'  => 'New Name Only',
            'email' => 'original@critiplay.test',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Profil berhasil diperbarui']);
        $response->assertJson(['email_changed' => false]);

        $user->refresh();
        $this->assertEquals('New Name Only', $user->name);
        $this->assertNotNull($user->email_verified_at);
        $this->assertNull($user->otp);
    }

    public function test_update_profile_with_new_email_generates_otp_and_resets_verification(): void
    {
        $user = User::factory()->create([
            'email'             => 'old@critiplay.test',
            'name'              => 'Old Name',
            'email_verified_at' => Carbon::now()->subDays(2),
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/profile', [
            'name'  => 'Updated Name',
            'email' => 'brandnew@critiplay.test',
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment(['email_changed' => true]);

        $user->refresh();
        $this->assertEquals('brandnew@critiplay.test', $user->email);
        $this->assertNull($user->email_verified_at);
        $this->assertNotNull($user->otp);
        $this->assertEquals(6, strlen((string) $user->otp));
        $this->assertNotNull($user->otp_expires_at);
        $this->assertTrue(Carbon::now()->lessThanOrEqualTo($user->otp_expires_at));
    }

    public function test_user_can_verify_new_email_with_generated_otp(): void
    {
        $user = User::factory()->create([
            'email'             => 'original@critiplay.test',
            'email_verified_at' => Carbon::now(),
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/profile', [
            'name'  => 'Tester',
            'email' => 'verifiednew@critiplay.test',
        ]);

        $user->refresh();
        $generatedOtp = $user->otp;

        // Verifikasi email baru via endpoint verify-otp
        $verifyResponse = $this->postJson('/api/verify-otp', [
            'email' => 'verifiednew@critiplay.test',
            'otp'   => $generatedOtp,
        ]);

        $verifyResponse->assertStatus(200);
        $verifyResponse->assertJson(['message' => 'Verifikasi email berhasil!']);

        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
        $this->assertNull($user->otp);
    }
}
