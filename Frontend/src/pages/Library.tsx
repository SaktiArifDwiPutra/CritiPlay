import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Pencil,
  Star,
  ArrowLeft,
  CheckCircle2,
  Gamepad2,
  Clock,
  XCircle,
  X,
  Loader2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import {
  libraryService,
  type LibraryGame,
  type LibraryStatus,
} from '../services/libraryService';
import { reviewService } from '../services/reviewService';

const tabs: {
  label: string;
  value: LibraryStatus;
}[] = [
  { label: 'All', value: 'all' },
  { label: 'Playing', value: 'playing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Plan to Play', value: 'plan_to_play' },
  { label: 'Dropped', value: 'dropped' },
];

const STATUS_CONFIG: Record<
  Exclude<LibraryStatus, 'all'>,
  { label: string; color: string; badge: string; icon: typeof Clock }
> = {
  playing: {
    label: 'Playing',
    color: 'text-emerald-400',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: Gamepad2,
  },
  completed: {
    label: 'Completed',
    color: 'text-indigo-400',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    icon: CheckCircle2,
  },
  plan_to_play: {
    label: 'Plan to Play',
    color: 'text-amber-400',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Clock,
  },
  dropped: {
    label: 'Dropped',
    color: 'text-rose-400',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    icon: XCircle,
  },
};

export default function Library() {
  const [activeTab, setActiveTab] = useState<LibraryStatus>('all');
  const [games, setGames] = useState<LibraryGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit Modal State
  const [editingGame, setEditingGame] = useState<LibraryGame | null>(null);
  const [editStatus, setEditStatus] = useState<Exclude<LibraryStatus, 'all'>>('plan_to_play');
  const [ratingGameplay, setRatingGameplay] = useState(8);
  const [ratingStory, setRatingStory] = useState(8);
  const [ratingVisual, setRatingVisual] = useState(8);
  const [reviewText, setReviewText] = useState('');
  const [includeRating, setIncludeRating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadLibrary = async () => {
      setIsLoading(true);
      try {
        const data = await libraryService.getLibrary(activeTab);

        if (cancelled) return;

        setGames(data);
        setError('');
      } catch (err) {
        if (cancelled) return;

        console.error('Gagal mengambil library:', err);
        setGames([]);
        setError('Gagal mengambil data Library.');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadLibrary();

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const handleOpenEditModal = (game: LibraryGame) => {
    setEditingGame(game);
    setEditStatus((game.pivot?.status as Exclude<LibraryStatus, 'all'>) || 'plan_to_play');
    setModalError('');

    if (game.user_review) {
      setRatingGameplay(game.user_review.rating_gameplay || 8);
      setRatingStory(game.user_review.rating_story || 8);
      setRatingVisual(game.user_review.rating_visual || 8);
      setReviewText(game.user_review.review_text || '');
      setIncludeRating(true);
    } else {
      setRatingGameplay(8);
      setRatingStory(8);
      setRatingVisual(8);
      setReviewText('');
      setIncludeRating(false);
    }
  };

  const handleCloseModal = () => {
    if (isSaving || isRemoving) return;
    setEditingGame(null);
    setModalError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame || isSaving) return;

    setIsSaving(true);
    setModalError('');

    try {
      // 1. Update status game jika berubah
      const currentStatus = editingGame.pivot?.status;
      if (editStatus !== currentStatus) {
        await libraryService.updateStatus(editingGame.id, editStatus);
      }

      // 2. Update atau simpan rating jika opsi rating aktif
      let updatedUserReview = editingGame.user_review || null;

      if (includeRating) {
        const overallScore = Math.round(((ratingGameplay + ratingStory + ratingVisual) / 3) * 10) / 10;

        if (editingGame.user_review?.id) {
          await reviewService.updateReview(
            editingGame.user_review.id,
            ratingGameplay,
            ratingStory,
            ratingVisual,
            reviewText
          );
          updatedUserReview = {
            ...editingGame.user_review,
            rating_gameplay: ratingGameplay,
            rating_story: ratingStory,
            rating_visual: ratingVisual,
            rating_overall: overallScore,
            review_text: reviewText,
          };
        } else {
          await reviewService.saveReview(
            String(editingGame.id),
            ratingGameplay,
            ratingStory,
            ratingVisual,
            reviewText
          );
          updatedUserReview = {
            id: 'temp-' + Date.now(),
            rating_gameplay: ratingGameplay,
            rating_story: ratingStory,
            rating_visual: ratingVisual,
            rating_overall: overallScore,
            review_text: reviewText,
          };
        }
      }

      // 3. Update daftar games di frontend secara optimistik
      setGames((prevGames) => {
        // Jika sedang memfilter tab spesifik dan status game berubah keluar dari tab ini, remove dari list
        if (activeTab !== 'all' && activeTab !== editStatus) {
          return prevGames.filter((g) => g.id !== editingGame.id);
        }

        return prevGames.map((g) => {
          if (g.id === editingGame.id) {
            return {
              ...g,
              pivot: {
                ...g.pivot,
                status: editStatus,
              },
              user_review: updatedUserReview,
            };
          }
          return g;
        });
      });

      setEditingGame(null);
    } catch (err) {
      console.error('Gagal memperbarui game:', err);
      if (err instanceof Error) {
        setModalError(err.message);
      } else {
        setModalError('Terjadi kesalahan saat menyimpan perubahan.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveFromLibrary = async () => {
    if (!editingGame || isRemoving) return;

    const confirmRemove = window.confirm(`Hapus "${editingGame.name}" dari Library?`);
    if (!confirmRemove) return;

    setIsRemoving(true);
    setModalError('');

    try {
      await libraryService.remove(editingGame.id);
      setGames((prevGames) => prevGames.filter((g) => g.id !== editingGame.id));
      setEditingGame(null);
    } catch (err) {
      console.error('Gagal menghapus game:', err);
      setModalError('Gagal menghapus game dari Library.');
    } finally {
      setIsRemoving(false);
    }
  };

  const calculatedOverall = Math.round(((ratingGameplay + ratingStory + ratingVisual) / 3) * 10) / 10;

  return (
    <div className="mx-auto max-w-6xl pb-16">

      {/* HEADER SECTION */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              My Library<span className="text-indigo-400">.</span>
            </h1>
            <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-300">
              {games.length} {games.length === 1 ? 'Game' : 'Games'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Koleksi pribadi, status progres bermain, dan catatan rating kamu.
          </p>
        </div>

        <Link
          to="/"
          className="group flex w-fit items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-300 shadow-sm transition-all duration-150 hover:scale-105 hover:border-slate-700 hover:text-white active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 text-indigo-400" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* TABS FILTER */}
      <div className="mb-8 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-1.5 backdrop-blur-md shadow-sm">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-95 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-400 shadow-sm">
          {error}
        </div>
      )}

      {/* SKELETON / LOADING STATE */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-xl border border-slate-800/70 bg-slate-900/50"
            >
              <div className="aspect-[3/4] w-full bg-slate-800/60" />
              <div className="p-3 space-y-2">
                <div className="h-3.5 w-3/4 rounded bg-slate-800" />
                <div className="h-2.5 w-1/3 rounded bg-slate-800/80" />
                <div className="flex gap-1 pt-1">
                  <div className="h-4 w-12 rounded bg-slate-800/60" />
                  <div className="h-4 w-12 rounded bg-slate-800/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : games.length === 0 ? (
        /* EMPTY STATE */
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/40 p-12 text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-600/10 text-indigo-400 shadow-sm">
            <Gamepad2 className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Belum ada game di kategori ini</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
            Mulai eksplorasi katalog game dan tambahkan game favoritmu ke koleksi library pribadi.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition-all duration-150 hover:scale-105 hover:bg-indigo-500 active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Jelajahi Katalog Game</span>
            </Link>
          </div>
        </div>
      ) : (
        /* GAME GRID (EXACTLY 4 CARDS PER ROW, WRAPS NATURALLY) */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {games.map((game) => {
            const statusKey = (game.pivot?.status || 'plan_to_play') as Exclude<LibraryStatus, 'all'>;
            const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.plan_to_play;
            const StatusIcon = statusCfg.icon;
            const userRating = game.user_review?.rating_overall;

            return (
              <div
                key={game.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/70 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-700/80 hover:shadow-lg hover:shadow-indigo-950/20"
              >
                {/* Clickable Image Section */}
                <Link
                  to={`/game/${game.id}`}
                  className="relative block aspect-[3/4] w-full overflow-hidden bg-slate-950"
                >
                  {game.cover_url ? (
                    <img
                      src={game.cover_url}
                      alt={game.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900 text-slate-600">
                      <Gamepad2 className="h-8 w-8 mb-1.5 opacity-50" />
                      <span className="text-[11px] font-semibold">No Cover</span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Status Badge in Top-Left */}
                  <div className="absolute left-2.5 top-2.5 z-10">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold backdrop-blur-md shadow-sm ${statusCfg.badge}`}
                    >
                      <StatusIcon className="h-2.5 w-2.5" />
                      <span>{statusCfg.label}</span>
                    </span>
                  </div>

                  {/* User Rating Badge in Top-Right */}
                  {userRating !== undefined && userRating !== null && (
                    <div className="absolute right-2.5 top-2.5 z-10">
                      <div className="flex items-center gap-1 rounded-md border border-amber-500/20 bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-md shadow-sm">
                        <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                        <span>{userRating.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                </Link>

                {/* Card Bottom Body */}
                <div className="flex flex-1 flex-col justify-between p-3">
                  <div>
                    <Link
                      to={`/game/${game.id}`}
                      className="line-clamp-1 text-sm font-bold text-white transition-colors hover:text-indigo-400"
                      title={game.name}
                    >
                      {game.name}
                    </Link>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{game.release_year ?? 'TBA'}</span>
                      {userRating ? (
                        <span className="text-indigo-400 font-medium text-[10px]">
                          Rating: {userRating.toFixed(1)}/10
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Belum di-rate</span>
                      )}
                    </div>

                    {/* Genres Pills */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {game.genres && game.genres.length > 0 ? (
                        game.genres.slice(0, 2).map((genre) => (
                          <span
                            key={genre}
                            className="rounded border border-slate-700/50 bg-slate-800/80 px-1.5 py-0.5 text-[9px] font-medium text-slate-300"
                          >
                            {genre}
                          </span>
                        ))
                      ) : (
                        <span className="text-[9px] text-slate-600">Game</span>
                      )}
                    </div>
                  </div>

                  {/* Footer with Circular Outline Pencil Edit Button in Bottom-Right */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/70 pt-2.5">
                    <span className="text-[10px] font-medium text-slate-500">
                      Opsi Koleksi
                    </span>

                    {/* Circular Outline Pencil Button (No background even on hover) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenEditModal(game);
                      }}
                      title="Edit Rating & Status"
                      aria-label={`Edit ${game.name}`}
                      className="flex h-7.5 w-7.5 items-center justify-center rounded-full border border-slate-700 bg-transparent text-slate-400 shadow-sm transition-all duration-150 hover:scale-110 hover:border-indigo-400 hover:text-indigo-300 hover:bg-transparent active:scale-95"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT STATUS & RATING MODAL */}
      {editingGame && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                {editingGame.cover_url ? (
                  <img
                    src={editingGame.cover_url}
                    alt={editingGame.name}
                    className="h-16 w-12 rounded-lg object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div className="flex h-16 w-12 items-center justify-center rounded-lg bg-slate-800 text-slate-500">
                    <Gamepad2 className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white line-clamp-1">
                    {editingGame.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {editingGame.release_year ?? 'TBA'} • Edit status & rating koleksi
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSaving || isRemoving}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error in modal */}
            {modalError && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-400">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-5">
              {/* STATUS SELECTION */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Status Bermain
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(Object.keys(STATUS_CONFIG) as Array<Exclude<LibraryStatus, 'all'>>).map((status) => {
                    const cfg = STATUS_CONFIG[status];
                    const Icon = cfg.icon;
                    const isSelected = editStatus === status;

                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setEditStatus(status)}
                        className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all duration-150 hover:scale-[1.02] active:scale-95 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-600/20 text-white ring-1 ring-indigo-500/30'
                            : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isSelected ? cfg.color : 'text-slate-400'}`} />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RATING SECTION */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeRating}
                      onChange={(e) => setIncludeRating(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500/30"
                    />
                    <span className="text-sm font-semibold text-slate-200">
                      Beri Rating / Review Game
                    </span>
                  </label>

                  {includeRating && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-300">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>Overall: {calculatedOverall}/10</span>
                    </div>
                  )}
                </div>

                {includeRating && (
                  <div className="mt-4 space-y-4 pt-3 border-t border-slate-800/70">
                    {/* Gameplay Aspect */}
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">Gameplay</span>
                        <span className="font-bold text-indigo-400">{ratingGameplay}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={ratingGameplay}
                        onChange={(e) => setRatingGameplay(Number(e.target.value))}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-indigo-500"
                      />
                    </div>

                    {/* Story Aspect with purple accent */}
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">Story</span>
                        <span className="font-bold text-purple-400">{ratingStory}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={ratingStory}
                        onChange={(e) => setRatingStory(Number(e.target.value))}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-purple-500"
                      />
                    </div>

                    {/* Visual Aspect */}
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">Visual</span>
                        <span className="font-bold text-indigo-400">{ratingVisual}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={ratingVisual}
                        onChange={(e) => setRatingVisual(Number(e.target.value))}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-indigo-500"
                      />
                    </div>

                    {/* Review Notes (Optional) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Catatan Jurnal / Pendapat Singkat (Opsional)
                      </label>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Tulis ulasan atau kesanmu mengenai game ini..."
                        rows={3}
                        className="w-full rounded-xl border border-slate-700/70 bg-slate-800/60 p-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRemoveFromLibrary}
                  disabled={isSaving || isRemoving}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 transition-all hover:bg-rose-500/20 disabled:opacity-50"
                >
                  {isRemoving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  <span>Hapus dari Library</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={isSaving || isRemoving}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-50"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving || isRemoving}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 transition-all duration-150 hover:scale-105 hover:bg-indigo-500 active:scale-95 disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan Perubahan</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}