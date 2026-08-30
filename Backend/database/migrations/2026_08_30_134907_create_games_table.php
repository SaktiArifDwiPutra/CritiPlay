<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); 
            $table->string('title');
            $table->string('cover_image')->nullable();
            $table->string('developer');
            $table->date('release_date');
            $table->json('genres'); 
            $table->timestamps();
            });
        }

    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
