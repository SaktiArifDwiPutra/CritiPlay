<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    use HasFactory;

    protected $fillable = ['user_id','title', 'cover_image', 'developer', 'release_date', 'genres'];

    // Casting otomatis dari/ke JSON
    protected $casts = [
        'genres' => 'array',
    ];

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }
}