import { authService } from './authService';
import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/library`;

export type LibraryStatus =
  | 'all'
  | 'plan_to_play'
  | 'playing'
  | 'completed'
  | 'dropped';

export interface LibraryGame {
  id: number | string;
  igdb_id: number;
  name: string;
  cover_url: string | null;
  release_year: string | null;
  genres: string[];
  platforms: string[];
  summary: string | null;
  pivot?: {
    status: LibraryStatus;
  };
  user_review?: {
    id: string;
    rating_gameplay: number;
    rating_story: number;
    rating_visual: number;
    rating_overall: number;
    review_text: string | null;
  } | null;
}

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${authService.getToken()}`
});

export const libraryService = {
  getLibrary: async (
    status: LibraryStatus = 'all'
  ): Promise<LibraryGame[]> => {
    const response = await fetch(
      `${API_URL}?status=${status}`,
      {
        headers: getHeaders()
      }
    );

    if (!response.ok) {
      throw new Error('Gagal mengambil Library');
    }

    return response.json();
  },

  updateStatus: async (
  gameId: string | number,
  status: Exclude<LibraryStatus, 'all'>
): Promise<void> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      game_id: gameId,
      status
    })
  });

  if (!response.ok) {
    throw new Error('Gagal mengubah status game');
  }
},

  remove: async (gameId: string | number): Promise<void> => {
    const response = await fetch(`${API_URL}/${gameId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Gagal menghapus game dari Library');
    }
  }
};