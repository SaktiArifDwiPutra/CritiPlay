import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gameService } from '../services/gameService';
import type { Game } from '../types';

export default function GameList() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await gameService.getAllGames();
        setGames(data);
      } catch (error) {
        console.error("Gagal", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGames();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">My Game Journal</h1>
      
      {isLoading ? (
        <div className="flex justify-center h-40 items-center">
          <p className="text-slate-500 animate-pulse font-medium">Memuat data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            // 1. Tag div kita ganti jadi Link, arahkan ke URL spesifik
            <Link 
              to={`/game/${game.id}`} 
              key={game.id} 
              className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden border border-slate-100 flex flex-col cursor-pointer"
            >
              <img src={game.coverImage} alt={game.title} className="w-full h-48 object-cover" />
              <div className="p-5 flex flex-col flex-grow">
                <h2 className="text-xl font-bold text-slate-800 mb-3 line-clamp-1">{game.title}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {game.genres.map((genre) => (
                    <span key={genre} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-md">
                      {genre}
                    </span>
                  ))}
                </div>
                <div className="mt-auto pt-4 border-t border-slate-50 text-sm text-slate-500 flex justify-between items-center">
                  <span className="font-medium">{game.developer}</span>
                  <span>{new Date(game.releaseDate).getFullYear()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}