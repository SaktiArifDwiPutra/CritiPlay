import { authService } from './authService';

export interface AspectLeader {
  id: string;
  name: string;
  cover_url: string | null;
  score: number;
  totalReviews: number;
}

export interface StatisticsData {
  personal: {
    library: {
      total: number;
      completed: number;
      playing: number;
      plan_to_play: number;
      dropped: number;
      completion_rate: number;
    };
    reviews: {
      count: number;
      helpful_votes_received: number;
      averages: {
        gameplay: number;
        story: number;
        visual: number;
        overall: number;
      };
    };
    top_genres: { name: string; count: number }[];
    top_platforms: { name: string; count: number }[];
    highest_rated_games: {
      id: string;
      name: string;
      cover_url: string | null;
      rating_overall: number;
      rating_gameplay: number;
      rating_story: number;
      rating_visual: number;
      review_text: string | null;
    }[];
  };
  community: {
    overview: {
      total_catalog_games: number;
      total_reviewed_games: number;
      total_reviews: number;
      total_active_players: number;
    };
    aspect_leaders: {
      gameplay: AspectLeader | null;
      story: AspectLeader | null;
      visual: AspectLeader | null;
      overall: AspectLeader | null;
    };
    aspect_averages: {
      gameplay: number;
      story: number;
      visual: number;
      overall: number;
    };
    rating_distribution: { range: string; count: number }[];
    most_reviewed_games: {
      id: string;
      name: string;
      cover_url: string | null;
      avg_overall: number;
      totalReviews: number;
    }[];
  };
}

const API_URL = 'http://127.0.0.1:8000/api/statistics';

export const statisticsService = {
  getStatistics: async (): Promise<StatisticsData> => {
    const response = await fetch(API_URL, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authService.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Gagal mengambil data statistik');
    }

    return response.json();
  },
};
