import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { gameService } from '../services/gameService';
import { reviewService } from '../services/reviewService';
import type { Game, Review, GameStatus, RatingAspect } from '../types';
import ReviewCard from '../components/ReviewCard';
import ReviewFormModal from '../components/ReviewFormModal';
// 1. Import EditGameModal
import EditGameModal from '../components/EditGameModal';

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [game, setGame] = useState<Game | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  
  // States untuk Modals
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isEditGameModalOpen, setIsEditGameModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchGameDetail = async () => {
      if (!id) return; 
      try {
        const data = await gameService.getGameById(id);
        if (data) {
          setGame(data);
          const reviewData = await reviewService.getReviewsByGameId(id);
          setReviews(reviewData);
        } else setIsError(true);
      } catch (error) {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGameDetail();
  }, [id]);

  // === LOGIC GAME ===
  const handleUpdateGame = async (updatedData: Partial<Game>) => {
    if (!game) return;
    try {
      const updated = await gameService.updateGame(game.id, updatedData);
      if (updated) setGame(updated);
      setIsEditGameModalOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteGame = async () => {
    if (!game) return;
    if (window.confirm(`Yakin ingin menghapus game "${game.title}"?`)) {
      await reviewService.deleteReviewsByGameId(game.id);
      await gameService.deleteGame(game.id);
      navigate('/');
    }
  };

  // === LOGIC REVIEW ===
  const handleSubmitReview = async (status: GameStatus, aspects: RatingAspect[], content: string) => {
    if (!game) return;
    const totalScore = aspects.reduce((sum, aspect) => sum + aspect.score, 0);
    const avgScore = Number((totalScore / aspects.length).toFixed(1));

    setIsReviewModalOpen(false);

    try {
      if (editingReview) {
        // Mode EDIT
        const updated = await reviewService.updateReview(editingReview.id, { 
          status, aspectRatings: aspects, overallRating: avgScore, content 
        });
        if (updated) {
          setReviews(reviews.map(r => r.id === updated.id ? updated : r));
        }
      } else {
        // Mode TAMBAH BARU
        const newReview: Review = {
          id: `r${Date.now()}`, gameId: game.id, status, aspectRatings: aspects, overallRating: avgScore, content, dateAdded: new Date().toISOString()
        };
        await reviewService.saveReview(newReview);
        setReviews([newReview, ...reviews]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenEditReview = (review: Review) => {
    setEditingReview(review);
    setIsReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false);
    setEditingReview(null); // Reset state saat ditutup
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm("Yakin ingin menghapus jurnal ini?")) {
      await reviewService.deleteReview(reviewId);
      setReviews(reviews.filter(r => r.id !== reviewId)); 
    }
  };

  if (isLoading) return <div className="max-w-4xl mx-auto flex justify-center items-center h-64"><p className="text-slate-500 animate-pulse font-medium">Memuat detail game...</p></div>;
  if (isError || !game) return <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm text-center">Game Tidak Ditemukan</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Link to="/" className="text-slate-500 hover:text-blue-600 hover:underline font-medium">&larr; Kembali</Link>
        
        <div className="flex gap-2">
          {/* Tombol Edit Game */}
          <button onClick={() => setIsEditGameModalOpen(true)} className="text-slate-500 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            Edit Game
          </button>
          <button onClick={handleDeleteGame} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            Hapus Game
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row mb-8">
        <div className="md:w-1/3 bg-slate-50 p-6 flex justify-center items-start">
          <img src={game.coverImage} alt={game.title} className="w-full max-w-sm rounded-xl shadow-md object-cover aspect-[3/4]" />
        </div>
        <div className="md:w-2/3 p-8 md:p-10 flex flex-col justify-center">
          <div className="flex flex-wrap gap-2 mb-4">
            {game.genres.map((genre) => <span key={genre} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-lg">{genre}</span>)}
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{game.title}</h1>
          <p className="text-lg text-slate-500 font-medium mb-8">{game.developer} &bull; {new Date(game.releaseDate).getFullYear()}</p>
          
          <div className="mt-auto pt-8 border-t border-slate-100 flex gap-4">
            <button onClick={() => setIsReviewModalOpen(true)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-sm">
              + Tulis Jurnal
            </button>
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-bold text-slate-800 mb-6">Jurnal Pribadi</h3>
      {reviews.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-500 border-dashed border-2">Belum ada jurnal.</div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} onDelete={handleDeleteReview} onEdit={handleOpenEditReview} />
          ))}
        </div>
      )}

      {/* Render Modals */}
      <ReviewFormModal 
        isOpen={isReviewModalOpen} 
        onClose={handleCloseReviewModal} 
        onSubmit={handleSubmitReview} 
        initialData={editingReview} 
      />
      <EditGameModal 
        isOpen={isEditGameModalOpen} 
        onClose={() => setIsEditGameModalOpen(false)} 
        game={game} 
        onUpdate={handleUpdateGame} 
      />
    </div>
  );
}