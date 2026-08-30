import type { Review } from '../types';
import mockReviews from '../data/mockReviews.json';

const STORAGE_KEY = 'critiplay_reviews';

const getStoredReviews = (): Review[] => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) return JSON.parse(storedData);
  
  const initialData = mockReviews as Review[];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
};

export const reviewService = {
  getReviewsByGameId: async (gameId: string): Promise<Review[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filtered = getStoredReviews().filter((r) => r.gameId === gameId);
        filtered.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
        resolve(filtered);
      }, 400);
    });
  },
  saveReview: async (newReview: Review): Promise<Review> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allReviews = getStoredReviews();
        allReviews.push(newReview);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allReviews));
        resolve(newReview);
      }, 300);
    });
  },
  // === FITUR BARU V3 ===
  updateReview: async (id: string, updatedData: Partial<Review>): Promise<Review | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allReviews = getStoredReviews();
        const index = allReviews.findIndex(r => r.id === id);
        if (index !== -1) {
          allReviews[index] = { ...allReviews[index], ...updatedData };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(allReviews));
          resolve(allReviews[index]);
        } else {
          resolve(undefined);
        }
      }, 300);
    });
  },
  deleteReview: async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let allReviews = getStoredReviews();
        allReviews = allReviews.filter(r => r.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allReviews));
        resolve(true);
      }, 300);
    });
  },
  deleteReviewsByGameId: async (gameId: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let allReviews = getStoredReviews();
        allReviews = allReviews.filter(r => r.gameId !== gameId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allReviews));
        resolve();
      }, 300);
    });
  }
};