<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->string('otp')->nullable();
        $table->timestamp('otp_expires_at')->nullable();
        $table->timestamp('email_verified_at')->nullable();
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn([
            'otp',
            'otp_expires_at',
            'email_verified_at',
        ]);
    });
}
};
