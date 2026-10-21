import type { Game, ExternalGame } from '../types';
import { authService } from './authService'; 

interface RawGame {
  id: string | number;
  igdb_id?: number | null;
  igdbId?: number | null;
  name: string;
  cover_url?: string | null;
  coverUrl?: string | null;
  release_year?: string | null;
  releaseYear?: string | null;
  genres?: string[] | null;
  platforms?: string[] | null;
  summary?: string | null;
  avgGameplay?: number | string | null;
  avgStory?: number | string | null;
  avgVisual?: number | string | null;
  avgOverall?: number | string | null;
  totalReviews?: number | string | null;
}

interface RawExternalGame {
  igdb_id: number;
  name: string;
  cover_url: string | null;
  release_year: string | null;
  genres: string[];
  platforms: string[];
}

const API_URL = 'http://127.0.0.1:8000/api/games';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${authService.getToken()}`
});

const toNumber = (value: number | string | null | undefined): number =>
  Number(value ?? 0);

const mapGame = (raw: RawGame): Game => ({
  id: String(raw.id),
  igdb_id: Number(raw.igdb_id ?? raw.igdbId ?? 0),
  name: raw.name,
  cover_url: raw.cover_url ?? raw.coverUrl ?? null,
  release_year: raw.release_year ?? raw.releaseYear ?? null,
  genres: raw.genres ?? [],
  platforms: raw.platforms ?? [],
  summary: raw.summary ?? null,
  avgGameplay: toNumber(raw.avgGameplay),
  avgStory: toNumber(raw.avgStory),
  avgVisual: toNumber(raw.avgVisual),
  avgOverall: toNumber(raw.avgOverall),
  totalReviews: toNumber(raw.totalReviews)
});

const unwrapGame = (data: RawGame | { game: RawGame }): RawGame =>
  'game' in data ? data.game : data;

const getGameById = async (id: string): Promise<Game | undefined> => {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: getHeaders()
  });

  if (!response.ok) return undefined;

  return mapGame(unwrapGame(await response.json()));
};

const fetchDatabaseIdsByIgdbId = async (): Promise<Map<number, string>> => {
  const idMap = new Map<number, string>();

  try {
    const response = await fetch(API_URL, { headers: getHeaders() });

    if (!response.ok) return idMap;

    const raw: RawGame[] | { data?: RawGame[] } = await response.json();
    const list = Array.isArray(raw) ? raw : raw.data ?? [];

    list.forEach((item) => {
      const igdbId = Number(item.igdb_id ?? item.igdbId ?? 0);

      if (igdbId > 0) {
        idMap.set(igdbId, String(item.id));
      }
    });
  } catch (error) {
    console.error('Gagal mengambil daftar game database:', error);
  }

  return idMap;
};

interface RawReview {
  id: string | number;
  game?: RawGame | null;
  userName: string;
  userAvatar?: string | null;
  ratingGameplay?: number | string | null;
  ratingStory?: number | string | null;
  ratingVisual?: number | string | null;
  ratingOverall?: number | string | null;
  reviewText?: string | null;
  helpfulCount?: number | string | null;
  dateAdded?: string | null;
}

export interface RecentReview {
  id: string;
  game: Game;
  userName: string;
  userAvatar: string | null;
  ratingGameplay: number;
  ratingStory: number;
  ratingVisual: number;
  ratingOverall: number;
  reviewText: string;
  helpfulCount: number;
  dateAdded: string | null;
}

const LIBRARY_URL = 'http://127.0.0.1:8000/api/library';
const REVIEWS_URL = 'http://127.0.0.1:8000/api/reviews';

export const gameService = {
  getAllGames: async (): Promise<Game[]> => {
    const response = await fetch(API_URL, { headers: getHeaders() });
    if (!response.ok) return [];
    return response.json();
  },

  getGameById,

  searchGames: async (query: string): Promise<(ExternalGame | Game)[]> => {
    const response = await fetch(
      `${API_URL}/search?q=${encodeURIComponent(query)}`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Gagal mencari game');
    }

    const data: RawExternalGame[] = await response.json();

    const externalGames: ExternalGame[] = data.map((game) => ({
      igdb_id: game.igdb_id,
      name: game.name,
      cover_url: game.cover_url,
      release_year: game.release_year,
      genres: game.genres,
      platforms: game.platforms,
    }));

    const databaseIds = await fetchDatabaseIdsByIgdbId();

    if (databaseIds.size === 0) {
      return externalGames;
    }

    return Promise.all(
      externalGames.map(async (externalGame) => {
        const databaseId = databaseIds.get(externalGame.igdb_id);

        if (!databaseId) return externalGame;

        try {
          const databaseGame = await getGameById(databaseId);
          return databaseGame ?? externalGame;
        } catch (error) {
          console.error('Gagal mengambil rating game:', error);
          return externalGame;
        }
      })
    );
  },

  getRecommendedGames: async (
    limit = 12
  ): Promise<(ExternalGame | Game)[]> => {
    const response = await fetch(
      `${API_URL}/recommendations?limit=${encodeURIComponent(limit)}`,
      { headers: getHeaders() }
    );

    if (!response.ok) {
      throw new Error('Gagal mengambil rekomendasi');
    }

    const data: (RawGame | RawExternalGame)[] = await response.json();

    return data.map((game) => {
      if ('id' in game && game.id !== undefined && game.id !== null) {
        return mapGame(game as RawGame);
      }
      return {
        igdb_id: Number(game.igdb_id),
        name: game.name,
        cover_url: game.cover_url ?? (game as RawGame).coverUrl ?? null,
        release_year: game.release_year ?? (game as RawGame).releaseYear ?? null,
        genres: game.genres ?? [],
        platforms: game.platforms ?? [],
      } as ExternalGame;
    });
  },

  getRecentReviews: async (limit = 4): Promise<RecentReview[]> => {
    const response = await fetch(
      `${REVIEWS_URL}/recent?limit=${encodeURIComponent(limit)}`,
      { headers: getHeaders() }
    );

    if (!response.ok) return [];

    const reviews: RawReview[] = await response.json();

    return reviews
      .filter((review): review is RawReview & { game: RawGame } => Boolean(review.game))
      .map((review): RecentReview => ({
        id: String(review.id),
        game: mapGame(review.game),
        userName: review.userName,
        userAvatar: review.userAvatar ?? null,
        ratingGameplay: toNumber(review.ratingGameplay),
        ratingStory: toNumber(review.ratingStory),
        ratingVisual: toNumber(review.ratingVisual),
        ratingOverall: toNumber(review.ratingOverall),
        reviewText: review.reviewText ?? '',
        helpfulCount: toNumber(review.helpfulCount),
        dateAdded: review.dateAdded ?? null
      }));
  },

  addToLibrary: async (
    gameId: number,
    status: 'plan_to_play' | 'playing' | 'completed' | 'dropped'
  ): Promise<void> => {
    const response = await fetch(LIBRARY_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ game_id: gameId, status })
    });

    if (!response.ok) {
      throw new Error('Gagal menyimpan ke library');
    }
  },

  importGame: async (igdbId: number): Promise<Game> => {
    const response = await fetch(`${API_URL}/import`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        igdb_id: igdbId,
      }),
    });

    if (!response.ok) {
      throw new Error('Gagal mengimport game');
    }

    return mapGame(unwrapGame(await response.json()));
  },

  addGame: async (newGameData: Omit<Game, 'id'>): Promise<Game> => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(newGameData)
    });
    const data = await response.json();
    return { ...newGameData, id: data.id };
  },

  updateGame: async (id: string, updatedData: Partial<Game>): Promise<Game | undefined> => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updatedData)
    });
    if (!response.ok) return undefined;
    return { id, ...updatedData } as Game;
  },

  deleteGame: async (id: string): Promise<boolean> => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.ok;
  },

  getTopRatedGames: async (
    type: 'overall' | 'gameplay' | 'story' | 'visual'
  ): Promise<Game[]> => {
    const response = await fetch(
      `${API_URL}/top-rated?type=${type}`,
      {
        headers: getHeaders()
      }
    );

    if (!response.ok) {
      return [];
    }

    const data: RawGame[] = await response.json();

    return data.map(mapGame);
  },

  getTopRatedSummary: async (): Promise<{
    overall: Game[];
    gameplay: Game[];
    story: Game[];
    visual: Game[];
  }> => {
    const response = await fetch(`${API_URL}/top-rated-summary`, {
      headers: getHeaders()
    });

    if (!response.ok) {
      return { overall: [], gameplay: [], story: [], visual: [] };
    }

    const data: {
      overall?: RawGame[];
      gameplay?: RawGame[];
      story?: RawGame[];
      visual?: RawGame[];
    } = await response.json();

    return {
      overall: (data.overall ?? []).map(mapGame),
      gameplay: (data.gameplay ?? []).map(mapGame),
      story: (data.story ?? []).map(mapGame),
      visual: (data.visual ?? []).map(mapGame),
    };
  },
};