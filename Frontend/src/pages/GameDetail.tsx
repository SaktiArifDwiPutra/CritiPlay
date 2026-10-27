import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Gamepad2,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Sparkles,
  MessageSquare,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Edit3,
  Trash2,
  Loader2,
  Share2,
  Check,
} from 'lucide-react';
import { gameService } from '../services/gameService';
import { reviewService } from '../services/reviewService';
import type { Game, Review, ReviewDiscussion, RatingAspect } from '../types';
import ReviewCard from '../components/ReviewCard';
import ReviewFormModal from '../components/ReviewFormModal';
import StarRatingInput, { RATING_DESCRIPTIONS } from '../components/StarRatingInput';
import { libraryService } from '../services/libraryService';
import type { LibraryStatus } from '../services/libraryService';
import { authService } from '../services/authService';

type SortOption = 'newest' | 'highest' | 'lowest' | 'helpful';

const STATUS_BUTTONS: {
  status: Exclude<LibraryStatus, 'all'>;
  label: string;
  icon: typeof Clock;
  activeClass: string;
  inactiveClass: string;
}[] = [
  {
    status: 'plan_to_play',
    label: 'Plan to Play',
    icon: Clock,
    activeClass:
      'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30 ring-2 ring-amber-500/30',
    inactiveClass:
      'border-slate-800 bg-slate-900/60 text-amber-400/90 hover:bg-amber-500/10 hover:border-amber-500/30',
  },
  {
    status: 'playing',
    label: 'Playing',
    icon: Gamepad2,
    activeClass:
      'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/30',
    inactiveClass:
      'border-slate-800 bg-slate-900/60 text-emerald-400/90 hover:bg-emerald-500/10 hover:border-emerald-500/30',
  },
  {
    status: 'completed',
    label: 'Completed',
    icon: CheckCircle2,
    activeClass:
      'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 ring-2 ring-indigo-500/30',
    inactiveClass:
      'border-slate-800 bg-slate-900/60 text-indigo-400/90 hover:bg-indigo-500/10 hover:border-indigo-500/30',
  },
  {
    status: 'dropped',
    label: 'Dropped',
    icon: XCircle,
    activeClass:
      'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30 ring-2 ring-rose-500/30',
    inactiveClass:
      'border-slate-800 bg-slate-900/60 text-rose-400/90 hover:bg-rose-500/10 hover:border-rose-500/30',
  },
];

export default function GameDetail() {
  const { id } = useParams();

  const [game, setGame] = useState<Game | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  const [libraryStatus, setLibraryStatus] = useState<LibraryStatus | null>(null);
  const [isUpdatingLibrary, setIsUpdatingLibrary] = useState(false);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [discussionReviewId, setDiscussionReviewId] = useState<string | null>(null);
  const [discussions, setDiscussions] = useState<ReviewDiscussion[]>([]);
  const [discussionText, setDiscussionText] = useState('');
  const [isDiscussionLoading, setIsDiscussionLoading] = useState(false);
  const [isDiscussionSubmitting, setIsDiscussionSubmitting] = useState(false);

  // UX Enhancements
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const [isCopiedShare, setIsCopiedShare] = useState(false);
  const [quickRateScore, setQuickRateScore] = useState<number>(0);

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

        const reviewData = await reviewService.getReviewsByGameId(id);
        setReviews(reviewData);

        const profile = await authService.getProfile();
        if (profile?.user?.id) {
          setCurrentUserId(String(profile.user.id));
        }

        // Check if game is in user library
        try {
          const userLibrary = await libraryService.getLibrary('all');
          const matchedGame = userLibrary.find(
            (g) => String(g.id) === String(id)
          );
          if (matchedGame?.pivot?.status) {
            setLibraryStatus(matchedGame.pivot.status);
          }
        } catch {
          // Library check is non-fatal
        }
      } catch (error) {
        console.error('Gagal mengambil detail game:', error);
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
      console.error('Gagal mengubah status Library:', error);
    } finally {
      setIsUpdatingLibrary(false);
    }
  };

  const handleOpenReview = () => {
    const myReview = reviews.find(
      (review) => String(review.userId) === String(currentUserId)
    );

    setEditingReview(myReview ?? null);
    setIsReviewModalOpen(true);
  };

  const handleQuickRate = (score: number) => {
    setQuickRateScore(score);
    const myReview = reviews.find(
      (review) => String(review.userId) === String(currentUserId)
    );

    if (myReview) {
      setEditingReview(myReview);
    } else {
      setEditingReview({
        id: '',
        gameId: game?.id ?? '',
        userId: currentUserId ?? '',
        userName: '',
        userAvatar: null,
        ratingGameplay: score,
        ratingStory: score,
        ratingVisual: score,
        ratingOverall: score,
        reviewText: '',
        dateAdded: new Date().toISOString(),
        helpfulCount: 0,
        isHelpfulByMe: false,
      });
    }
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async (
    aspects: RatingAspect[],
    content: string
  ) => {
    if (!game) return;

    const gameplay = aspects.find(
      (aspect) => aspect.aspect.toLowerCase() === 'gameplay'
    )?.score;

    const story = aspects.find(
      (aspect) => aspect.aspect.toLowerCase() === 'story'
    )?.score;

    const visual = aspects.find(
      (aspect) => aspect.aspect.toLowerCase() === 'visual'
    )?.score;

    if (
      gameplay === undefined ||
      story === undefined ||
      visual === undefined
    ) {
      console.error('Rating Gameplay, Story, atau Visual belum lengkap.');
      return;
    }

    try {
      if (editingReview && editingReview.id) {
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

      const updatedReviews = await reviewService.getReviewsByGameId(game.id);
      setReviews(updatedReviews);

      const updatedGame = await gameService.getGameById(game.id);
      if (updatedGame) {
        setGame(updatedGame);
        sessionStorage.setItem(`game-${game.id}`, JSON.stringify(updatedGame));
      }

      setIsReviewModalOpen(false);
      setEditingReview(null);
    } catch (error) {
      console.error('Gagal menyimpan review:', error);
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

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Yakin ingin menghapus jurnal ini?')) {
      const success = await reviewService.deleteReview(reviewId);

      if (success) {
        setReviews(reviews.filter((review) => review.id !== reviewId));

        if (game) {
          const updatedGame = await gameService.getGameById(game.id);
          if (updatedGame) {
            setGame(updatedGame);
            sessionStorage.setItem(`game-${game.id}`, JSON.stringify(updatedGame));
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
                isHelpfulByMe: result.isHelpful,
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

  const handleDeleteDiscussion = async (discussionId: string) => {
    if (!window.confirm('Hapus komentar ini?')) return;

    try {
      const success = await reviewService.deleteDiscussion(discussionId);

      if (success) {
        setDiscussions((prev) =>
          prev.filter((discussion) => discussion.id !== discussionId)
        );
      }
    } catch (error) {
      console.error('Gagal menghapus discussion:', error);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopiedShare(true);
      setTimeout(() => setIsCopiedShare(false), 2000);
    }
  };

  const myReview = useMemo(
    () => reviews.find((review) => String(review.userId) === String(currentUserId)),
    [reviews, currentUserId]
  );

  const sortedReviews = useMemo(() => {
    const list = [...reviews];
    switch (sortBy) {
      case 'highest':
        return list.sort((a, b) => Number(b.ratingOverall) - Number(a.ratingOverall));
      case 'lowest':
        return list.sort((a, b) => Number(a.ratingOverall) - Number(b.ratingOverall));
      case 'helpful':
        return list.sort((a, b) => Number(b.helpfulCount) - Number(a.helpfulCount));
      case 'newest':
      default:
        return list.sort(
          (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        );
    }
  }, [reviews, sortBy]);

  // Overall Score Calculation & Descriptor
  const overallAvg = Number(game?.avgOverall ?? 0);
  const roundedOverall = Math.min(10, Math.max(1, Math.round(overallAvg)));
  const ratingDescriptor = overallAvg > 0 ? RATING_DESCRIPTIONS[roundedOverall] : null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-9 w-32 rounded-xl bg-slate-900 border border-slate-800" />
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 h-96 flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 h-80 rounded-2xl bg-slate-800/60" />
            <div className="w-full md:w-2/3 space-y-4">
              <div className="h-6 w-1/4 rounded bg-slate-800" />
              <div className="h-10 w-3/4 rounded bg-slate-800" />
              <div className="h-5 w-1/2 rounded bg-slate-800/70" />
              <div className="h-24 w-full rounded-2xl bg-slate-800/40 mt-8" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !game) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10 backdrop-blur-md shadow-2xl">
          <Gamepad2 className="mx-auto h-16 w-16 text-slate-600 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Game Tidak Ditemukan</h2>
          <p className="text-sm text-slate-400 mb-6">
            Data game yang kamu cari tidak tersedia atau mungkin telah dihapus.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-5xl pb-16">
      {/* Ambient Backdrop Cover Glow */}
      {game.cover_url && (
        <div className="pointer-events-none absolute -top-8 left-1/2 -z-10 h-96 w-full max-w-4xl -translate-x-1/2 opacity-25 blur-3xl overflow-hidden">
          <img
            src={game.cover_url}
            alt=""
            className="h-full w-full object-cover scale-125 saturate-150"
          />
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="group flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-300 shadow-sm backdrop-blur-md transition-all duration-150 hover:border-slate-700 hover:text-white hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 text-indigo-400 transition-transform group-hover:-translate-x-0.5" />
          <span>Kembali</span>
        </Link>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs font-semibold text-slate-300 backdrop-blur-md transition-all hover:border-slate-700 hover:text-white active:scale-95"
          title="Salin tautan game"
        >
          {isCopiedShare ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Tersalin!</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5 text-indigo-400" />
              <span>Bagikan</span>
            </>
          )}
        </button>
      </div>

      {/* GAME HERO SHOWCASE */}
      <div className="mb-8 overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/80 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row">
          {/* Cover Section */}
          <div className="flex shrink-0 items-center justify-center p-6 md:w-80 md:p-8 bg-slate-950/40 border-b md:border-b-0 md:border-r border-slate-800/70">
            <div className="relative group w-full max-w-[240px] md:max-w-none overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl transition-transform duration-300 hover:scale-[1.02]">
              {game.cover_url ? (
                <img
                  src={game.cover_url}
                  alt={game.name}
                  className="aspect-[3/4] w-full object-cover rounded-2xl"
                />
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
                  <Gamepad2 className="h-16 w-16" />
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="flex flex-1 flex-col p-6 sm:p-8 md:p-10">
            {/* Genre Badges */}
            <div className="mb-3 flex flex-wrap gap-2">
              {game.genres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-400 shadow-sm"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Game Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
              {game.name}
            </h1>

            {/* Platform & Release Year */}
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400 font-medium mb-6">
              <span className="flex items-center gap-1.5">
                <Gamepad2 className="h-4 w-4 text-indigo-400" />
                {game.platforms.join(', ')}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-purple-400" />
                {game.release_year ?? 'TBA'}
              </span>
            </div>

            {/* Game Summary / Description if available */}
            {game.summary && (
              <div className="mb-6 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Tentang Game
                </p>
                <p
                  className={`text-xs sm:text-sm text-slate-300 leading-relaxed ${
                    !isSummaryExpanded ? 'line-clamp-3' : ''
                  }`}
                >
                  {game.summary}
                </p>
                {game.summary.length > 200 && (
                  <button
                    type="button"
                    onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    <span>{isSummaryExpanded ? 'Sembunyikan' : 'Baca selengkapnya'}</span>
                    {isSummaryExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            )}

            {/* RATING BREAKDOWN */}
            <div className="mb-6 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-inner">
                    <Star className="h-7 w-7 fill-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">
                        {overallAvg.toFixed(1)}
                      </span>
                      <span className="text-sm font-semibold text-slate-400">/ 10</span>
                    </div>
                    <p className="text-xs text-slate-400">Overall Community Rating</p>
                  </div>
                </div>

                {ratingDescriptor && (
                  <div
                    className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold ${ratingDescriptor.badgeBg}`}
                  >
                    ⭐ {ratingDescriptor.title} ({ratingDescriptor.subtitle})
                  </div>
                )}
              </div>

              {/* 3 Aspect Rating Cards */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {/* Gameplay */}
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-center transition-all hover:bg-indigo-500/10">
                  <p className="text-xs font-semibold text-indigo-300 mb-0.5">Gameplay</p>
                  <p className="text-xl sm:text-2xl font-black text-indigo-400">
                    {Number(game.avgGameplay ?? 0).toFixed(1)}
                  </p>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (Number(game.avgGameplay ?? 0) / 10) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Story */}
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-center transition-all hover:bg-purple-500/10">
                  <p className="text-xs font-semibold text-purple-300 mb-0.5">Story</p>
                  <p className="text-xl sm:text-2xl font-black text-purple-400">
                    {Number(game.avgStory ?? 0).toFixed(1)}
                  </p>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (Number(game.avgStory ?? 0) / 10) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Visual */}
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-center transition-all hover:bg-cyan-500/10">
                  <p className="text-xs font-semibold text-cyan-300 mb-0.5">Visual</p>
                  <p className="text-xl sm:text-2xl font-black text-cyan-400">
                    {Number(game.avgVisual ?? 0).toFixed(1)}
                  </p>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (Number(game.avgVisual ?? 0) / 10) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <p className="text-right text-[11px] text-slate-500 mt-2.5">
                Berdasarkan {game.totalReviews ?? 0} ulasan pengguna CritiPlay
              </p>
            </div>

            {/* LIBRARY STATUS SELECTOR */}
            <div className="mt-auto pt-6 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Status Library Anda
                </p>
                {isUpdatingLibrary && (
                  <span className="flex items-center gap-1 text-[11px] text-indigo-400 animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" /> Menyimpan...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {STATUS_BUTTONS.map((btn) => {
                  const Icon = btn.icon;
                  const isActive = libraryStatus === btn.status;

                  return (
                    <button
                      key={btn.status}
                      type="button"
                      onClick={() => handleLibraryStatus(btn.status)}
                      disabled={isUpdatingLibrary}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-95 disabled:opacity-50 ${
                        isActive ? btn.activeClass : btn.inactiveClass
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{btn.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Action Button: Tulis Jurnal / Edit Jurnal */}
              <button
                type="button"
                onClick={handleOpenReview}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all duration-150 hover:scale-[1.01] active:scale-95"
              >
                <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12 text-amber-300" />
                <span>{myReview ? 'Edit Jurnal Anda' : '+ Tulis Jurnal & Review'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK RATING SECTION (Requirement 2 & UX Surprise) */}
      {!myReview && (
        <div className="mb-8 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 to-slate-900/60 p-5 backdrop-blur-md shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                <h3 className="text-sm font-bold text-white">Beri Rating Cepat</h3>
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
                  Interaktif 1-10
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sentuh bintang untuk memilih skor dan lihat deskripsi levelnya.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenReview}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 self-start sm:self-auto"
            >
              Atau tulis ulasan lengkap &rarr;
            </button>
          </div>

          <StarRatingInput
            value={quickRateScore}
            onChange={handleQuickRate}
          />
        </div>
      )}

      {/* USER'S OWN REVIEW HIGHLIGHT (UX Enhancement) */}
      {myReview && (
        <div className="mb-8 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5 sm:p-6 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-indigo-500/20">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Jurnal & Review Anda
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenEditReview(myReview)}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteReview(myReview.id)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>

          <ReviewCard
            review={myReview}
            isOwner={true}
            onDelete={handleDeleteReview}
            onEdit={handleOpenEditReview}
            onHelpful={handleHelpful}
            onDiscussion={handleDiscussion}
          />
        </div>
      )}

      {/* COMMUNITY REVIEWS SECTION */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-extrabold tracking-tight text-white">
              Ulasan Komunitas
            </h3>
            <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-300">
              {reviews.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Pendapat dan skor dari para pemain game di CritiPlay
          </p>
        </div>

        {/* Sort Filter Selector (UX Enhancement) */}
        {reviews.length > 1 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            >
              <option value="newest">Ulasan Terbaru</option>
              <option value="highest">Rating Tertinggi</option>
              <option value="lowest">Rating Terendah</option>
              <option value="helpful">Paling Membantu</option>
            </select>
          </div>
        )}
      </div>

      {/* Review List or Empty State */}
      {reviews.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <Gamepad2 className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h4 className="text-base font-bold text-slate-300 mb-1">
            Belum ada review untuk game ini
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            Jadilah yang pertama memainkan dan menulis jurnal penilaian untuk {game.name}!
          </p>
          <button
            type="button"
            onClick={handleOpenReview}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 transition-all active:scale-95"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Tulis Review Pertama</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              isOwner={String(review.userId) === String(currentUserId)}
              onDelete={handleDeleteReview}
              onEdit={handleOpenEditReview}
              onHelpful={handleHelpful}
              onDiscussion={handleDiscussion}
            />
          ))}
        </div>
      )}

      {/* REVIEW FORM MODAL */}
      <ReviewFormModal
        key={editingReview?.id ?? 'new'}
        isOpen={isReviewModalOpen}
        onClose={handleCloseReviewModal}
        onSubmit={handleSubmitReview}
        initialData={editingReview}
      />

      {/* DISCUSSION MODAL */}
      {discussionReviewId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setDiscussionReviewId(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Diskusi Review</h2>
                  <p className="text-xs text-slate-400">
                    Diskusikan review ini bersama komunitas CritiPlay
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDiscussionReviewId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Discussions List */}
            <div className="p-6">
              <div className="max-h-72 overflow-y-auto space-y-3.5 pr-1 scrollbar-none">
                {isDiscussionLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-500 text-xs">
                    <Loader2 className="h-5 w-5 animate-spin mb-2 text-indigo-400" />
                    <span>Memuat komentar diskusi...</span>
                  </div>
                ) : discussions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>Belum ada diskusi untuk review ini.</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Mulai percakapan dengan menulis komentar pertama di bawah!
                    </p>
                  </div>
                ) : (
                  discussions.map((discussion) => (
                    <div key={discussion.id} className="flex gap-3">
                      {/* Avatar */}
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                        {discussion.userAvatar ? (
                          <img
                            src={discussion.userAvatar}
                            alt={discussion.userName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          discussion.userName.charAt(0).toUpperCase()
                        )}
                      </div>

                      {/* Content Bubble */}
                      <div className="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-xs font-bold text-white">
                            {discussion.userName}
                          </p>

                          {String(discussion.userId) === String(currentUserId) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDiscussion(discussion.id)}
                              className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
                            >
                              Hapus
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {discussion.content}
                        </p>

                        <p className="text-[10px] text-slate-500 mt-1.5">
                          {new Date(discussion.dateAdded).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-800/80 mt-4 pt-4">
                <textarea
                  value={discussionText}
                  onChange={(e) => setDiscussionText(e.target.value)}
                  placeholder="Tulis pendapat atau tanggapanmu..."
                  rows={3}
                  maxLength={1000}
                  className="w-full resize-none rounded-xl border border-slate-700/80 bg-slate-950/80 p-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25"
                />

                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-[11px] text-slate-500">
                    {discussionText.length}/1000
                  </span>

                  <button
                    type="button"
                    onClick={handleSubmitDiscussion}
                    disabled={!discussionText.trim() || isDiscussionSubmitting}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isDiscussionSubmitting && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                    <span>{isDiscussionSubmitting ? 'Mengirim...' : 'Kirim'}</span>
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
