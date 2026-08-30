import type { Review } from '../types';
import { authService } from './authService';

const API_URL = 'http://127.0.0.1:8000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${authService.getToken()}`
});

export const reviewService = {
  getReviewsByGameId: async (gameId: string): Promise<Review[]> => {
    const response = await fetch(`${API_URL}/games/${gameId}/reviews`, { headers: getHeaders() });
    if (!response.ok) return [];
    return response.json();
  },

  saveReview: async (newReview: Review): Promise<Review> => {
    const response = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(newReview)
    });
    const data = await response.json();
    return { ...newReview, id: data.id };
  },

  updateReview: async (id: string, updatedData: Partial<Review>): Promise<Review | undefined> => {
    const response = await fetch(`${API_URL}/reviews/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updatedData)
    });
    if (!response.ok) return undefined;
    return { id, ...updatedData } as Review;
  },

  deleteReview: async (id: string): Promise<boolean> => {
    const response = await fetch(`${API_URL}/reviews/${id}`, { 
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.ok;
  },

  deleteReviewsByGameId: async (_gameId: string): Promise<void> => {
    return Promise.resolve();
  }
};