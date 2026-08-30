import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gameService } from '../services/gameService';
import type { Game } from '../types';
import AddGameModal from '../components/AddGameModal';

export default function GameList() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // State baru untuk filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const data = await gameService.getAllGames();
        setGames(data);
      } catch (error) {
        console.error("Gagal mengambil data game:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGames();
  }, []);

  const handleAddGame = async (gameData: Omit<Game, 'id'>) => {
    try {
      const newGame = await gameService.addGame(gameData);
      setGames([newGame, ...games]);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Gagal menambah game:", error);
    }
  };

  // 1. Ekstrak semua genre unik dari daftar game untuk opsi dropdown
  const allGenres = Array.from(
    new Set(games.flatMap((game) => game.genres))
  ).sort();

  // 2. Logika penyaringan (Filtering)
  const filteredGames = games.filter((game) => {
    // Cek apakah judul game mengandung kata yang diketik (case-insensitive)
    const matchSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Cek apakah game memiliki genre yang dipilih (kalau "All" berarti lolos)
    const matchGenre = selectedGenre === 'All' || game.genres.includes(selectedGenre);
    
    return matchSearch && matchGenre;
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header & Tombol Tambah (Sama) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-slate-800">My Game Journal</h1>
        
        <div className="flex gap-3">
          <Link to="/stats" className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-5 rounded-xl border border-slate-200 transition-colors shadow-sm flex items-center gap-2">
            <span>📊 Statistik</span>
          </Link>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors shadow-sm flex items-center gap-2">
            <span>+ Tambah Game</span>
          </button>
        </div>
      </div>

      {/* 3. Baris Filter & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex-1">
          <input 
            type="text" 
            placeholder="Cari judul game..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="md:w-1/3">
          <select 
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">Semua Genre</option>
            {allGenres.map((genre) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Tampilan Daftar Game (Menggunakan array filteredGames, bukan games) */}
      {isLoading ? (
        <div className="flex justify-center h-40 items-center">
          <p className="text-slate-500 animate-pulse font-medium">Memuat data...</p>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-500 border-dashed border-2">
          Tidak ada game yang cocok dengan pencarianmu.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <Link to={`/game/${game.id}`} key={game.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden border border-slate-100 flex flex-col cursor-pointer">
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

      <AddGameModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddGame={handleAddGame} />
    </div>
  );
}