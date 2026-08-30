import type { Game } from '../types';
import mockGames from '../data/mockGames.json';

const STORAGE_KEY = 'critiplay_games';

const getStoredGames = (): Game[] => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) return JSON.parse(storedData);
  
  const initialData = mockGames as Game[];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
};

export const gameService = {
  getAllGames: async (): Promise<Game[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(getStoredGames().reverse()), 500);
    });
  },
  getGameById: async (id: string): Promise<Game | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(getStoredGames().find((g) => g.id === id)), 500);
    });
  },
  addGame: async (newGameData: Omit<Game, 'id'>): Promise<Game> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const games = getStoredGames();
        const newGame: Game = { ...newGameData, id: `g${Date.now()}` };
        games.push(newGame);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
        resolve(newGame);
      }, 400);
    });
  },
  // === FITUR BARU V3 ===
  updateGame: async (id: string, updatedData: Partial<Game>): Promise<Game | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const games = getStoredGames();
        const index = games.findIndex(g => g.id === id);
        if (index !== -1) {
          games[index] = { ...games[index], ...updatedData };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
          resolve(games[index]);
        } else {
          resolve(undefined);
        }
      }, 400);
    });
  },
  deleteGame: async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let games = getStoredGames();
        games = games.filter(g => g.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
        resolve(true);
      }, 400);
    });
  }
};