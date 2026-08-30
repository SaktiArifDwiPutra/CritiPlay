import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gameService } from '../services/gameService';
//import { reviewService } from '../services/reviewService';
import type { Game, Review } from '../types';

export default function Statistics() {
  const [games, setGames] = useState<Game[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const fetchedGames = await gameService.getAllGames();
        setGames(fetchedGames);
        
        // Karena reviewService kita saat ini butuh gameId per game,
        // kita ambil manual dari localStorage untuk statistik global.
        // (Di V3 nanti ini bisa diganti jadi 1x hit API endpoint /stats)
        const storedReviews = localStorage.getItem('critiplay_reviews');
        if (storedReviews) {
          setReviews(JSON.parse(storedReviews));
        }
      } catch (error) {
        console.error("Gagal memuat data statistik", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // Kalkulasi Statistik
  const totalGames = games.length;
  const totalReviews = reviews.length;
  
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews).toFixed(1) 
    : '0.0';

  const countStatus = (status: string) => reviews.filter(r => r.status === status).length;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><p className="text-slate-500 animate-pulse">Menghitung statistik...</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/" className="text-slate-500 hover:text-blue-600 hover:underline mb-6 inline-block font-medium">
        &larr; Kembali ke Beranda
      </Link>
      
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Statistik Jurnal Kamu</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Total Game */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <span className="text-slate-400 font-semibold mb-2 uppercase tracking-wider text-sm">Total Game Tersimpan</span>
          <span className="text-5xl font-extrabold text-blue-600">{totalGames}</span>
        </div>

        {/* Card 2: Total Jurnal */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <span className="text-slate-400 font-semibold mb-2 uppercase tracking-wider text-sm">Total Jurnal Ditulis</span>
          <span className="text-5xl font-extrabold text-indigo-600">{totalReviews}</span>
        </div>

        {/* Card 3: Rata-rata Rating */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <span className="text-slate-400 font-semibold mb-2 uppercase tracking-wider text-sm">Rata-rata Rating</span>
          <span className="text-5xl font-extrabold text-amber-500">{avgRating}</span>
        </div>
      </div>

      {/* Breakdown Status */}
      <h2 className="text-xl font-bold text-slate-800 mb-4">Sebaran Status Game</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex flex-col items-center">
          <span className="text-3xl font-bold text-green-700 mb-1">{countStatus('Completed')}</span>
          <span className="text-green-600 text-sm font-semibold">Completed</span>
        </div>
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex flex-col items-center">
          <span className="text-3xl font-bold text-blue-700 mb-1">{countStatus('Playing')}</span>
          <span className="text-blue-600 text-sm font-semibold">Playing</span>
        </div>
        <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex flex-col items-center">
          <span className="text-3xl font-bold text-red-700 mb-1">{countStatus('Dropped')}</span>
          <span className="text-red-600 text-sm font-semibold">Dropped</span>
        </div>
        <div className="bg-purple-50 border border-purple-100 p-6 rounded-2xl flex flex-col items-center">
          <span className="text-3xl font-bold text-purple-700 mb-1">{countStatus('Plan to Play')}</span>
          <span className="text-purple-600 text-sm font-semibold">Plan to Play</span>
        </div>
      </div>
    </div>
  );
}