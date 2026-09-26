import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gameService } from '../services/gameService';
import type { Game } from '../types';
import AddGameModal from '../components/AddGameModal';

// ==========================================
// GAME CARD SKELETON
// ==========================================
const GameCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100 animate-pulse">
      {/* Cover */}
      <div className="w-full h-48 bg-slate-200" />

      <div className="p-5">
        {/* Title */}
        <div className="h-6 bg-slate-200 rounded-md w-3/4 mb-4" />

        {/* Genre */}
        <div className="flex gap-2 mb-4">
          <div className="h-6 w-16 bg-slate-200 rounded-md" />
          <div className="h-6 w-20 bg-slate-200 rounded-md" />
        </div>

        {/* Developer + Year */}
        <div className="pt-4 border-t border-slate-100 flex justify-between">
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="h-4 bg-slate-200 rounded w-12" />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// GAME CARD
// Nanti dipakai ketika data dari backend sudah ada
// ==========================================
const GameCard = ({ game }: { game: Game }) => {
  return (
    <Link
      to={`/game/${game.id}`}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden border border-slate-100 flex flex-col cursor-pointer"
    >
      <img
        src={game.coverImage}
        alt={game.title}
        className="w-full h-48 object-cover"
      />

      <div className="p-5 flex flex-col flex-grow">
        <h2 className="text-xl font-bold text-slate-800 mb-3 line-clamp-1">
          {game.title}
        </h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {game.genres.map((genre) => (
            <span
              key={genre}
              className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-md"
            >
              {genre}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-50 text-sm text-slate-500 flex justify-between items-center">
          <span className="font-medium">
            {game.developer}
          </span>

          <span>
            {new Date(game.releaseDate).getFullYear()}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default function GameList() {
  // ==========================================
  // STATE LIBRARY LAMA
  // ==========================================
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Filter library lama
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');

  // ==========================================
  // STATE V4 SEARCH
  // ==========================================
  const [externalSearchQuery, setExternalSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Game[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // ==========================================
  // AMBIL DATA LIBRARY
  // FITUR LAMA
  // ==========================================
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

  // ==========================================
  // TAMBAH GAME MANUAL
  // FITUR LAMA
  // ==========================================
  const handleAddGame = async (gameData: Omit<Game, 'id'>) => {
    try {
      const newGame = await gameService.addGame(gameData);
      setGames([newGame, ...games]);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Gagal menambah game:", error);
    }
  };

  // ==========================================
  // V4 SEARCH GAME
  //
  // SEKARANG MASIH KOSONG.
  //
  // NANTI TINGGAL ISI BAGIAN INI DENGAN
  // gameService.searchGames(query)
  // ==========================================
  const handleExternalSearch = () => {
    const query = externalSearchQuery.trim();

    if (!query) {
      return;
    }

    // Untuk sekarang belum melakukan request.
    //
    // NANTI:
    //
    // const results = await gameService.searchGames(query);
    // setSearchResults(results);
  };

  // ==========================================
  // ENTER UNTUK SEARCH
  // ==========================================
  const handleExternalSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter') {
      handleExternalSearch();
    }
  };

  // ==========================================
  // GENRE FILTER
  // ==========================================
  const allGenres = Array.from(
    new Set(games.flatMap((game) => game.genres))
  ).sort();

  // ==========================================
  // FILTER LIBRARY
  // FITUR LAMA
  // ==========================================
  const filteredGames = games.filter((game) => {
    const matchSearch = game.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchGenre =
      selectedGenre === 'All' ||
      game.genres.includes(selectedGenre);

    return matchSearch && matchGenre;
  });

  return (
    <div className="max-w-6xl mx-auto">

      {/* ==========================================
          HEADER
          ========================================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">

        <h1 className="text-3xl font-bold text-slate-800">
          My Game Journal
        </h1>

        <div className="flex gap-3">

          <Link
            to="/stats"
            className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-5 rounded-xl border border-slate-200 transition-colors shadow-sm flex items-center gap-2"
          >
            <span>📊 Statistik</span>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            <span>+ Tambah Game</span>
          </button>

        </div>
      </div>

      {/* ==========================================
          V4 SEARCH GAME
          ========================================== */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8">

        <div className="flex flex-col sm:flex-row gap-3">

          <input
            type="text"
            placeholder="Cari game dari database..."
            value={externalSearchQuery}
            onChange={(e) => setExternalSearchQuery(e.target.value)}
            onKeyDown={handleExternalSearchKeyDown}
            className="flex-1 border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />

          <button
            onClick={handleExternalSearch}
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            {isSearching ? 'Mencari...' : 'Cari Game'}
          </button>

        </div>
      </div>

      {/* ==========================================
          V4 GAME CARDS
          
          SEKARANG:
          Skeleton saja.

          NANTI:
          Kalau searchResults sudah berisi data,
          bagian ini tinggal render GameCard.
          ========================================== */}
      <div className="mb-8">

        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Game Database
        </h2>

        {searchResults.length > 0 ? (

          // ==========================================
          // DATA DARI BACKEND
          // NANTI AKAN MASUK SINI
          // ==========================================
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((game) => (
              <GameCard
                key={game.id}
                game={game}
              />
            ))}
          </div>

        ) : (

          // ==========================================
          // SEMENTARA BELUM ADA DATA
          // TAMPILKAN SKELETON TERUS
          // ==========================================
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <GameCardSkeleton key={index} />
            ))}
          </div>

        )}

      </div>

      {/* ==========================================
          FILTER LIBRARY LAMA
          ========================================== */}
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

            <option value="All">
              Semua Genre
            </option>

            {allGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}

          </select>

        </div>
      </div>

      {/* ==========================================
          LIBRARY GAME LAMA
          ========================================== */}
      {isLoading ? (

        <div className="flex justify-center h-40 items-center">
          <p className="text-slate-500 animate-pulse font-medium">
            Memuat data...
          </p>
        </div>

      ) : filteredGames.length === 0 ? (

        <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center text-slate-500 border-dashed border-2">
          Tidak ada game yang cocok dengan pencarianmu.
        </div>

      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
            />
          ))}

        </div>

      )}

      {/* ==========================================
          ADD GAME MODAL
          ========================================== */}
      <AddGameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddGame={handleAddGame}
      />

    </div>
  );
}