<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = ['game_id', 'status', 'aspect_ratings', 'overall_rating', 'content'];

    protected $casts = [
        'aspect_ratings' => 'array',
        'overall_rating' => 'float',
    ];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }
}