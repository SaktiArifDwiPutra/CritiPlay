<?php

namespace Tests\Feature;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OtpRateLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_verify_otp_within_rate_limit(): void
    {
        $user = User::factory()->create([
            'email'             => 'valid@critiplay.test',
            'otp'               => '123456',
            'otp_expires_at'    => Carbon::now()->addMinutes(10),
            'email_verified_at' => null,
        ]);

        $response = $this->postJson('/api/verify-otp', [
            'email' => 'valid@critiplay.test',
            'otp'   => '123456',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Verifikasi email berhasil!']);

        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
        $this->assertNull($user->otp);
    }

    public function test_verify_otp_is_rate_limited_after_five_attempts(): void
    {
        User::factory()->create([
            'email'             => 'target@critiplay.test',
            'otp'               => '999999',
            'otp_expires_at'    => Carbon::now()->addMinutes(10),
            'email_verified_at' => null,
        ]);

        // 5 percobaan pertama ditolak dengan 422 (salah OTP)
        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/verify-otp', [
                'email' => 'target@critiplay.test',
                'otp'   => '111111',
            ]);
            $response->assertStatus(422);
            $response->assertJson(['message' => 'Kode OTP salah atau tidak valid.']);
        }

        // Percobaan ke-6 dalam menit yang sama harus dicegat oleh rate limiter (429)
        $rateLimitedResponse = $this->postJson('/api/verify-otp', [
            'email' => 'target@critiplay.test',
            'otp'   => '111111',
        ]);

        $rateLimitedResponse->assertStatus(429);
    }
}
