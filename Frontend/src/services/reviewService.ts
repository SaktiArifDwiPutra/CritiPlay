import type { Review } from '../types';
import { authService } from './authService';

interface ReviewApiResponse {
  id: string | number;
  gameId: string | number;
  userId: string | number;
  userName: string | null;
  userAvatar: string | null;
  ratingGameplay: number | string;
  ratingStory: number | string;
  ratingVisual: number | string;
  ratingOverall: number | string;
  reviewText: string | null;
  helpfulCount: number | string;
  isHelpfulByMe: boolean;
  dateAdded: string;
}

const API_URL = 'http://127.0.0.1:8000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${authService.getToken()}`
});

export const reviewService = {
  getReviewsByGameId: async (gameId: string): Promise<Review[]> => {
    const response = await fetch(
      `${API_URL}/games/${gameId}/reviews`,
      {
        headers: getHeaders()
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    return data.map((review: ReviewApiResponse) => ({
      id: String(review.id),
      gameId: String(review.gameId),
      userId: String(review.userId),

      // Backend sekarang pakai userName / userAvatar
      name: review.userName ?? 'Unknown',
      avatar: review.userAvatar ?? null,

      ratingGameplay: Number(review.ratingGameplay),
      ratingStory: Number(review.ratingStory),
      ratingVisual: Number(review.ratingVisual),
      ratingOverall: Number(review.ratingOverall),

      reviewText: review.reviewText,
      dateAdded: review.dateAdded,

      helpfulCount: Number(review.helpfulCount ?? 0),
      isHelpfulByMe: Boolean(review.isHelpfulByMe)
    }));
  },

  saveReview: async (
    gameId: string,
    ratingGameplay: number,
    ratingStory: number,
    ratingVisual: number,
    reviewText: string
  ): Promise<void> => {
    const response = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        game_id: gameId,
        rating_gameplay: ratingGameplay,
        rating_story: ratingStory,
        rating_visual: ratingVisual,
        review_text: reviewText
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Gagal menyimpan review');
    }
  },

  updateReview: async (
    id: string,
    ratingGameplay: number,
    ratingStory: number,
    ratingVisual: number,
    reviewText: string
  ): Promise<void> => {
    const response = await fetch(`${API_URL}/reviews/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        rating_gameplay: ratingGameplay,
        rating_story: ratingStory,
        rating_visual: ratingVisual,
        review_text: reviewText
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Gagal mengupdate review');
    }
  },

  deleteReview: async (id: string): Promise<boolean> => {
    const response = await fetch(`${API_URL}/reviews/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    return response.ok;
  }
};
