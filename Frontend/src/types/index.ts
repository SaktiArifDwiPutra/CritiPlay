export type GameStatus = 'Playing' | 'Completed' | 'Dropped' | 'Plan to Play';

export interface Game {
  id: string;
  igdb_id: number;
  name: string;
  cover_url: string | null;
  release_year: string | null;
  genres: string[];
  platforms: string[];
  summary: string | null;

  avgGameplay: number;
  avgStory: number;
  avgVisual: number;
  avgOverall: number;
  totalReviews: number;
}
export interface ExternalGame {
  igdb_id: number;
  name: string;
  cover_url: string | null;
  release_year: string | null;
  genres: string[];
  platforms: string[];
}

export interface RatingAspect {
  aspect: string;
  score: number;  
}

export interface Review {
  id: string;
  gameId: string;
  userId: string;

  userName: string;
  userAvatar: string | null;

  ratingGameplay: number;
  ratingStory: number;
  ratingVisual: number;
  ratingOverall: number;

  reviewText: string | null;
  dateAdded: string;

  helpfulCount: number;
  isHelpfulByMe: boolean;
}

export interface ReviewDiscussion {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  content: string;
  dateAdded: string;
}

export interface SearchUser {
  id: string;
  name: string;
  avatar: string | null;
}

export interface PublicProfileGame {
  id: number;
  name: string;
  cover_url: string | null;
  release_year: string | null;
  genres: string[];
  platforms: string[];
  pivot?: {
    status: 'plan_to_play' | 'playing' | 'completed' | 'dropped';
    created_at?: string;
    updated_at?: string;
  };
}

export interface PublicProfile {
  user: {
    id: number;
    name: string;
    avatar: string | null;
    joined_at: string;
  };

  stats: {
    library: {
      total_games: number;
      completed: number;
      playing: number;
      plan_to_play: number;
      dropped: number;
    };

    total_reviews: number;

    followers_count?: number;
    following_count?: number;
    is_following?: boolean;
  };

  recent_activity: PublicProfileGame[];
}
