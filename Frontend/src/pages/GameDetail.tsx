
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { gameService } from '../services/gameService';
import { reviewService } from '../services/reviewService';
import type { Game, Review, ReviewDiscussion, RatingAspect } from '../types';
import ReviewCard from '../components/ReviewCard';
import ReviewFormModal from '../components/ReviewFormModal';
import { libraryService } from '../services/libraryService';
import type { LibraryStatus } from '../services/libraryService';
import { authService } from '../services/authService';

export default function GameDetail() {
  const { id } = useParams();

  const [game, setGame] = useState<Game | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  const [libraryStatus, setLibraryStatus] =
    useState<LibraryStatus | null>(null);

  const [isUpdatingLibrary, setIsUpdatingLibrary] =
    useState(false);

  const [isReviewModalOpen, setIsReviewModalOpen] =
    useState<boolean>(false);

  const [editingReview, setEditingReview] =
    useState<Review | null>(null);

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

    const [discussionReviewId, setDiscussionReviewId] =
    useState<string | null>(null);

  const [discussions, setDiscussions] =
    useState<ReviewDiscussion[]>([]);

  const [discussionText, setDiscussionText] =
    useState('');

  const [isDiscussionLoading, setIsDiscussionLoading] =
    useState(false);

  const [isDiscussionSubmitting, setIsDiscussionSubmitting] =
    useState(false);
    
  useEffect(() => {
    const fetchGameDetail = async () => {
      if (!id) return;

      try {
        const savedGame = sessionStorage.getItem(`game-${id}`);

        if (savedGame) {
          const parsedGame: Game = JSON.parse(savedGame);
          setGame(parsedGame);
        } else {
          const data = await gameService.getGameById(id);

          if (!data) {
            setIsError(true);
            return;
          }

          setGame(data);
        }

        const reviewData =
          await reviewService.getReviewsByGameId(id);

        setReviews(reviewData);

        const profile = await authService.getProfile();

        if (profile?.user?.id) {
          setCurrentUserId(String(profile.user.id));
        }
      } catch (error) {
        console.error(
          'Gagal mengambil detail game:',
          error
        );

        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameDetail();
  }, [id]);

  const handleLibraryStatus = async (
    status: Exclude<LibraryStatus, 'all'>
  ) => {
    if (!game || isUpdatingLibrary) return;

    try {
      setIsUpdatingLibrary(true);

      await libraryService.updateStatus(game.id, status);

      setLibraryStatus(status);
    } catch (error) {
      console.error(
        'Gagal mengubah status Library:',
        error
      );
    } finally {
      setIsUpdatingLibrary(false);
    }
  };

  const handleOpenReview = () => {
    const myReview = reviews.find(
      (review) =>
        String(review.userId) === String(currentUserId)
    );

    setEditingReview(myReview ?? null);
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async (
  aspects: RatingAspect[],
  content: string
) => {
    if (!game) return;

    const gameplay = aspects.find(
      (aspect) =>
        aspect.aspect.toLowerCase() === 'gameplay'
    )?.score;

    const story = aspects.find(
      (aspect) =>
        aspect.aspect.toLowerCase() === 'story'
    )?.score;

    const visual = aspects.find(
      (aspect) =>
        aspect.aspect.toLowerCase() === 'visual'
    )?.score;

    if (
      gameplay === undefined ||
      story === undefined ||
      visual === undefined
    ) {
      console.error(
        'Rating Gameplay, Story, atau Visual belum lengkap.'
      );
      return;
    }

    try {
      if (editingReview) {
        await reviewService.updateReview(
          editingReview.id,
          gameplay,
          story,
          visual,
          content
        );
      } else {
        await reviewService.saveReview(
          game.id,
          gameplay,
          story,
          visual,
          content
        );
      }

      const updatedReviews =
        await reviewService.getReviewsByGameId(
          game.id
        );

      setReviews(updatedReviews);

      const updatedGame =
        await gameService.getGameById(game.id);

      if (updatedGame) {
        setGame(updatedGame);

        sessionStorage.setItem(
          `game-${game.id}`,
          JSON.stringify(updatedGame)
        );
      }

      setIsReviewModalOpen(false);
      setEditingReview(null);
    } catch (error) {
      console.error(
        'Gagal menyimpan review:',
        error
      );
    }
  };

  const handleOpenEditReview = (review: Review) => {
    setEditingReview(review);
    setIsReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false);
    setEditingReview(null);
  };



  const handleDeleteReview = async (
    reviewId: string
  ) => {
    if (
      window.confirm(
        'Yakin ingin menghapus jurnal ini?'
      )
    ) {
      const success =
        await reviewService.deleteReview(reviewId);

      if (success) {
        setReviews(
          reviews.filter(
            (review) => review.id !== reviewId
          )
        );

        if (game) {
          const updatedGame =
            await gameService.getGameById(game.id);

          if (updatedGame) {
            setGame(updatedGame);

            sessionStorage.setItem(
              `game-${game.id}`,
              JSON.stringify(updatedGame)
            );
          }
        }
      }
    }
  };
  const handleHelpful = async (reviewId: string) => {
  try {
    const result = await reviewService.toggleHelpful(reviewId);

    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              helpfulCount: result.helpfulCount,
              isHelpfulByMe: result.isHelpful
            }
          : review
      )
    );
  } catch (error) {
    console.error('Gagal mengubah helpful:', error);
  }
};

const handleDiscussion = async (reviewId: string) => {
  try {
    setDiscussionReviewId(reviewId);
    setIsDiscussionLoading(true);
    setDiscussionText('');

    const data = await reviewService.getDiscussions(reviewId);

    setDiscussions(data);
  } catch (error) {
    console.error('Gagal mengambil discussion:', error);
    setDiscussions([]);
  } finally {
    setIsDiscussionLoading(false);
  }
};

const handleSubmitDiscussion = async () => {
  if (!discussionReviewId || !discussionText.trim()) return;

  try {
    setIsDiscussionSubmitting(true);

    const newDiscussion = await reviewService.addDiscussion(
      discussionReviewId,
      discussionText.trim()
    );

    setDiscussions((prev) => [...prev, newDiscussion]);
    setDiscussionText('');
  } catch (error) {
    console.error('Gagal menambahkan discussion:', error);
  } finally {
    setIsDiscussionSubmitting(false);
  }
};

const handleDeleteDiscussion = async (
  discussionId: string
) => {
  if (!window.confirm('Hapus komentar ini?')) return;

  try {
    const success =
      await reviewService.deleteDiscussion(discussionId);

    if (success) {
      setDiscussions((prev) =>
        prev.filter(
          (discussion) => discussion.id !== discussionId
        )
      );
    }
  } catch (error) {
    console.error('Gagal menghapus discussion:', error);
  }
};

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex justify-center items-center h-64">
        <p className="text-slate-500 animate-pulse font-medium">
          Memuat detail game...
        </p>
      </div>
    );
  }

  if (isError || !game) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm text-center">
        Game Tidak Ditemukan
      </div>
    );
  }

  const hasMyReview = reviews.some(
    (review) =>
      String(review.userId) === String(currentUserId)
  );

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <Link
          to="/"
          className="text-slate-500 hover:text-blue-600 hover:underline font-medium"
        >
          &larr; Kembali
        </Link>
      </div>

      {/* GAME HEADER */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row mb-8">
        <div className="md:w-1/3 bg-slate-50 p-6 flex justify-center items-start">
          <img
            src={game.cover_url ?? ''}
            alt={game.name}
            className="w-full max-w-sm rounded-xl shadow-md object-cover aspect-[3/4]"
          />
        </div>

        <div className="md:w-2/3 p-8 md:p-10 flex flex-col">
          <div className="flex flex-wrap gap-2 mb-4">
            {game.genres.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-lg"
              >
                {genre}
              </span>
            ))}
          </div>

          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
            {game.name}
          </h1>

          <p className="text-lg text-slate-500 font-medium mb-6">
            {game.platforms.join(', ')} &bull;{' '}
            {game.release_year ?? 'Unknown'}
          </p>

          {/* RATING */}
          <div className="mb-8">
            <div className="flex items-end gap-3 mb-5">
              <div className="text-5xl font-black text-blue-600">
                {Number(game.avgOverall ?? 0).toFixed(1)}
              </div>

              <div className="pb-1">
                <div className="text-yellow-500 text-xl">
                  ★★★★★
                </div>

                <p className="text-sm text-slate-500">
                  Overall Rating
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-500 mb-1">
                  Overall
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {Number(game.avgOverall ?? 0).toFixed(1)}
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-500 mb-1">
                  Gameplay
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {Number(game.avgGameplay ?? 0).toFixed(1)}
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-500 mb-1">
                  Story
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {Number(game.avgStory ?? 0).toFixed(1)}
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-500 mb-1">
                  Visual
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {Number(game.avgVisual ?? 0).toFixed(1)}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-400 mt-3">
              Berdasarkan {game.totalReviews ?? 0} review pengguna
            </p>
          </div>

          {/* LIBRARY */}
          <div className="mt-auto pt-6 border-t border-slate-100">
            <p className="text-sm font-semibold text-slate-500 mb-3">
              Status Library
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() =>
                  handleLibraryStatus('plan_to_play')
                }
                disabled={isUpdatingLibrary}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors ${
                  libraryStatus === 'plan_to_play'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                }`}
              >
                Plan to Play
              </button>

              <button
                onClick={() =>
                  handleLibraryStatus('playing')
                }
                disabled={isUpdatingLibrary}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors ${
                  libraryStatus === 'playing'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                Playing
              </button>

              <button
                onClick={() =>
                  handleLibraryStatus('completed')
                }
                disabled={isUpdatingLibrary}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors ${
                  libraryStatus === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                Completed
              </button>

              <button
                onClick={() =>
                  handleLibraryStatus('dropped')
                }
                disabled={isUpdatingLibrary}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-colors ${
                  libraryStatus === 'dropped'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                Dropped
              </button>
            </div>

            <button
              onClick={handleOpenReview}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-sm"
            >
              {hasMyReview
                ? 'Edit Jurnal'
                : '+ Tulis Jurnal'}
            </button>
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">
            Review Pengguna
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            {reviews.length} review dari pengguna CritiPlay
          </p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-500 border-dashed border-2">
          Belum ada review.
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onDelete={handleDeleteReview}
              onEdit={handleOpenEditReview}
              onHelpful={handleHelpful}
              onDiscussion={handleDiscussion}
            />
          ))}
        </div>
      )}

      <ReviewFormModal
  key={editingReview?.id ?? 'new'}
  isOpen={isReviewModalOpen}
  onClose={handleCloseReviewModal}
  onSubmit={handleSubmitReview}
  initialData={editingReview}
/>

{discussionReviewId && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    onClick={() => setDiscussionReviewId(null)}
  >
    <div
      className="w-full max-w-lg bg-white rounded-2xl shadow-xl"
      onClick={(event) => event.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Discussion
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Diskusikan review ini dengan pengguna lain
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDiscussionReviewId(null)}
          className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Discussions */}
      <div className="px-6 py-5">
        <div className="max-h-80 overflow-y-auto space-y-4">
          {isDiscussionLoading ? (
            <p className="text-center text-sm text-slate-400 py-8">
              Memuat discussion...
            </p>
          ) : discussions.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">
              Belum ada discussion.
            </p>
          ) : (
            discussions.map((discussion) => (
              <div
                key={discussion.id}
                className="flex gap-3"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold overflow-hidden shrink-0">
                  {discussion.userAvatar ? (
                    <img
                      src={discussion.userAvatar}
                      alt={discussion.userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    discussion.userName
                      .charAt(0)
                      .toUpperCase()
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800 text-sm">
                      {discussion.userName}
                    </p>

                    {String(discussion.userId) ===
                      String(currentUserId) && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteDiscussion(
                            discussion.id
                          )
                        }
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        Hapus
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">
                    {discussion.content}
                  </p>

                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(
                      discussion.dateAdded
                    ).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 mt-5 pt-5">
          <textarea
            value={discussionText}
            onChange={(event) =>
              setDiscussionText(event.target.value)
            }
            placeholder="Tulis komentar..."
            rows={3}
            maxLength={1000}
            className="w-full resize-none px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-400">
              {discussionText.length}/1000
            </span>

            <button
              type="button"
              onClick={handleSubmitDiscussion}
              disabled={
                !discussionText.trim() ||
                isDiscussionSubmitting
              }
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDiscussionSubmitting
                ? 'Mengirim...'
                : 'Kirim'}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
