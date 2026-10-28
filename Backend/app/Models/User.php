<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; 

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'role',
        'google_id',
        'otp',
        'otp_expires_at',
        'showcase_game_ids',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'otp',
        'otp_expires_at',
        'google_id',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at'   => 'datetime',
            'password'            => 'hashed',
            'showcase_game_ids'   => 'array',
        ];
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function games()
    {
        return $this->belongsToMany(Game::class, 'game_user')->withPivot('status')->withTimestamps();
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function following()
    {
        return $this->belongsToMany(User::class, 'follows', 'follower_id', 'following_id');
    }

    public function followers()
    {
        return $this->belongsToMany(User::class, 'follows', 'following_id', 'follower_id');
    }

    public function discussions()
    {
        return $this->hasMany(ReviewDiscussion::class);
    }

    public function getGamerStats(): array
    {
        $statusCounts = \Illuminate\Support\Facades\DB::table('game_user')
            ->where('user_id', $this->id)
            ->select('status', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $completed = (int) ($statusCounts['completed'] ?? 0);
        $playing = (int) ($statusCounts['playing'] ?? 0);
        $planToPlay = (int) ($statusCounts['plan_to_play'] ?? 0);
        $reviewsCount = $this->reviews()->count();

        $helpfulVotesReceived = (int) \Illuminate\Support\Facades\DB::table('review_helpful_votes')
            ->join('reviews', 'reviews.id', '=', 'review_helpful_votes.review_id')
            ->where('reviews.user_id', $this->id)
            ->count();

        $discussionsCount = \Illuminate\Support\Facades\DB::table('review_discussions')
            ->where('user_id', $this->id)
            ->count();

        $totalXp = ($reviewsCount * 50)
                 + ($completed * 30)
                 + ($playing * 10)
                 + ($planToPlay * 5)
                 + ($helpfulVotesReceived * 15)
                 + ($discussionsCount * 5);

        // Progression calculation
        $level = 1;
        $currentLevelXp = 0;
        $nextLevelXp = 60;

        while ($totalXp >= $nextLevelXp && $level < 100) {
            $currentLevelXp = $nextLevelXp;
            $level++;
            $step = 50 + ($level * 20);
            $nextLevelXp = $currentLevelXp + $step;
        }

        $xpInCurrentLevel = $totalXp - $currentLevelXp;
        $xpNeededForNext = $nextLevelXp - $currentLevelXp;
        $progressPercent = $xpNeededForNext > 0 ? min(100, round(($xpInCurrentLevel / $xpNeededForNext) * 100)) : 100;

        if ($level >= 35) {
            $tier = 'mythic';
            $badgeTitle = 'Mythic Legend';
            $color = '#A855F7';
        } elseif ($level >= 20) {
            $tier = 'platinum';
            $badgeTitle = 'Master Completionist';
            $color = '#10B981';
        } elseif ($level >= 10) {
            $tier = 'gold';
            $badgeTitle = 'Hardcore Critic';
            $color = '#F59E0B';
        } elseif ($level >= 5) {
            $tier = 'silver';
            $badgeTitle = 'Active Backlogger';
            $color = '#38BDF8';
        } else {
            $tier = 'bronze';
            $badgeTitle = 'Novice Explorer';
            $color = '#CD7F32';
        }

        return [
            'level'            => $level,
            'xp'               => $totalXp,
            'current_level_xp' => $currentLevelXp,
            'next_level_xp'    => $nextLevelXp,
            'xp_needed'        => max(0, $nextLevelXp - $totalXp),
            'progress_percent' => $progressPercent,
            'badge'            => [
                'tier'  => $tier,
                'title' => $badgeTitle,
                'color' => $color,
            ],
            'breakdown'        => [
                'completed_count'   => $completed,
                'reviews_count'     => $reviewsCount,
                'helpful_received'  => $helpfulVotesReceived,
                'discussions_count' => $discussionsCount,
            ],
        ];
    }
}