import type { Review } from '../types';
import mockReviews from '../data/mockReviews.json';

// Kunci / Nama tabel di dalam LocalStorage
const STORAGE_KEY = 'critiplay_reviews';

// Fungsi internal untuk membaca data dari LocalStorage
const getStoredReviews = (): Review[] => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) {
    return JSON.parse(storedData);
  }
  
  // Jika LocalStorage masih kosong (baru pertama kali buka web),
  // masukkan mock data sebagai nilai awal
  const initialData = mockReviews as Review[];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
};

export const reviewService = {
  // Mengambil daftar review berdasarkan ID game
  getReviewsByGameId: async (gameId: string): Promise<Review[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allReviews = getStoredReviews();
        const filteredReviews = allReviews.filter((r) => r.gameId === gameId);
        
        // Urutkan dari yang terbaru dibuat
        filteredReviews.sort((a, b) => 
          new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        );
        
        resolve(filteredReviews);
      }, 400); // Simulasi delay jaringan
    });
  },

  // Menyimpan review baru ke LocalStorage
  saveReview: async (newReview: Review): Promise<Review> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const allReviews = getStoredReviews();
        allReviews.push(newReview); // Tambahkan data baru
        
        // Simpan kembali array yang sudah di-update ke LocalStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allReviews));
        
        resolve(newReview);
      }, 300); // Simulasi proses loading saat nyimpan
    });
  }
};