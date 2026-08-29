import type { Game } from '../types';
import mockGames from '../data/mockGames.json';

// Kunci penyimpanannya dibedakan dari tabel review
const STORAGE_KEY = 'critiplay_games';

// Fungsi internal untuk membaca tabel Game
const getStoredGames = (): Game[] => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) {
    return JSON.parse(storedData);
  }
  
  const initialData = mockGames as Game[];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
};

export const gameService = {
  // 1. Read All Games
  getAllGames: async (): Promise<Game[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Kita reverse agar game yang baru ditambah muncul paling atas
        const games = getStoredGames().reverse();
        resolve(games);
      }, 500);
    });
  },

  // 2. Read Detail Game
  getGameById: async (id: string): Promise<Game | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const games = getStoredGames();
        const game = games.find((g) => g.id === id);
        resolve(game);
      }, 500);
    });
  },

  // 3. Create New Game
  // Omit<Game, 'id'> artinya: Butuh semua tipe data Game, KECUALI id
  addGame: async (newGameData: Omit<Game, 'id'>): Promise<Game> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const games = getStoredGames();
        
        // Generate ID otomatis (mirip Auto Increment di MySQL)
        const newGame: Game = {
          ...newGameData,
          id: `g${Date.now()}` 
        };
        
        games.push(newGame);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
        
        resolve(newGame);
      }, 400);
    });
  }
};