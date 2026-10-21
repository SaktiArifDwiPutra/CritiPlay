import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Plus,
  RefreshCw,
  Search,
  Star,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react';
import { gameService } from '../services/gameService';
import type { RecentReview } from '../services/gameService';
import type { ExternalGame, Game } from '../types';

type GameItem = ExternalGame | Game;
type AspectKey = 'gameplay' | 'story' | 'visual';

const RECENT_KEY = 'critiplay:recent-games';
const RECENT_LIMIT = 12;
const ROW_ITEM = 'w-36 shrink-0 snap-start sm:w-40 lg:w-44';
const GRID =
  'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
const HIDE_SCROLLBAR = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

const ASPECT_TABS: { key: AspectKey; label: string }[] = [
  { key: 'gameplay', label: 'Gameplay' },
  { key: 'story', label: 'Story' },
  { key: 'visual', label: 'Visual' },
];

const ASPECT_LABEL: Record<AspectKey, string> = {
  gameplay: 'Gameplay',
  story: 'Story',
  visual: 'Visual',
};

const ASPECT_FIELD = {
  gameplay: 'avgGameplay',
  story: 'avgStory',
  visual: 'avgVisual',
} as const;

const BAR_COLOR: Record<AspectKey, string> = {
  gameplay: 'bg-indigo-500',
  story: 'bg-violet-400',
  visual: 'bg-indigo-300',
};

const GEM_MIN_SCORE = 7.5;
const CONTRAST_MIN_GAP = 1.5;

type AspectContrast = {
  game: Game;
  high: AspectKey;
  low: AspectKey;
};

const CHIP_TONE = {
  indigo: 'bg-indigo-600 text-white ring-indigo-600',
  violet: 'bg-violet-600 text-white ring-violet-600',
};

const isDatabaseGame = (game: GameItem): game is Game => 'id' in game;

const getGameKey = (game: GameItem) =>
  isDatabaseGame(game) ? `db-${game.id}` : `ext-${game.igdb_id}`;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
};

const rankByFrequency = (values: string[]) => {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([value]) => value);
};

const readRecentGames = (): Game[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as Game[]) : [];
  } catch {
    return [];
  }
};

const saveRecentGame = (game: Game) => {
  try {
    const next = [
      game,
      ...readRecentGames().filter((item) => item.id !== game.id),
    ].slice(0, RECENT_LIMIT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    return;
  }
};

const useOpenGame = () => {
  const navigate = useNavigate();
  const [isOpening, setIsOpening] = useState(false);

  const openGame = async (game: GameItem) => {
    if (isOpening) return;

    try {
      setIsOpening(true);
      const target = isDatabaseGame(game)
        ? game
        : await gameService.importGame(game.igdb_id);

      sessionStorage.setItem(`game-${target.id}`, JSON.stringify(target));
      saveRecentGame(target);
      navigate(`/game/${target.id}`);
    } catch (error) {
      console.error('Gagal membuka game:', error);
    } finally {
      setIsOpening(false);
    }
  };

  return { openGame, isOpening };
};

const RatingLine = ({ game }: { game: GameItem }) => {
  if (!isDatabaseGame(game) || !game.totalReviews) {
    return (
      <span className="text-xs text-slate-500">
        Belum ada review
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs">
      <Star className="h-3.5 w-3.5 fill-violet-500 text-violet-500" />
      <span className="font-bold text-slate-100">
        {Number(game.avgOverall ?? 0).toFixed(1)}
      </span>
      <span className="text-slate-500">
        ({game.totalReviews})
      </span>
    </span>
  );
};

const GameCard = ({
  game,
  rank,
  className = '',
}: {
  game: GameItem;
  rank?: number;
  className?: string;
}) => {
  const { openGame, isOpening } = useOpenGame();

  return (
    <button
      type="button"
      onClick={() => openGame(game)}
      disabled={isOpening}
      className={`group flex min-w-0 flex-col text-left outline-none disabled:opacity-70 ${className}`}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-sm ring-1 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-indigo-500 bg-slate-800 ring-white/10">
        {game.cover_url ? (
          <img
            src={game.cover_url}
            alt={game.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-600">
            <Gamepad2 className="h-8 w-8" />
          </div>
        )}

        <div className="absolute inset-0 bg-slate-950/0 transition-colors duration-200 group-hover:bg-slate-950/10" />

        {rank !== undefined && (
          <span className="absolute left-2 top-2 rounded-md bg-slate-950/75 px-1.5 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
            #{rank}
          </span>
        )}

        {isOpening && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
            <RefreshCw className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>

      <h3 className="mt-3 line-clamp-1 text-sm font-semibold transition-colors text-slate-100 group-hover:text-indigo-400">
        {game.name}
      </h3>

      <div className="mt-1">
        <RatingLine game={game} />
      </div>

      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-400">
        <span className="line-clamp-1">
          {(game.platforms ?? []).slice(0, 2).join(', ')}
        </span>
        <span className="shrink-0">{game.release_year ?? ''}</span>
      </div>
    </button>
  );
};

const CardSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="aspect-[2/3] w-full rounded-lg bg-slate-800" />
    <div className="mt-3 h-4 w-3/4 rounded bg-slate-800" />
    <div className="mt-2 h-3 w-1/2 rounded bg-slate-800" />
  </div>
);

const RowSkeleton = () => (
  <div className={`flex gap-4 overflow-hidden ${HIDE_SCROLLBAR}`}>
    {Array.from({ length: 6 }).map((_, index) => (
      <CardSkeleton key={index} className={ROW_ITEM} />
    ))}
  </div>
);

const HomeSkeleton = () => (
  <div>
    <div className="mb-12 h-80 animate-pulse rounded-2xl bg-slate-800" />
    <div className="mb-4 h-7 w-48 animate-pulse rounded bg-slate-800" />
    <RowSkeleton />
  </div>
);

const SearchSkeleton = () => (
  <div className={GRID}>
    {Array.from({ length: 10 }).map((_, index) => (
      <CardSkeleton key={index} />
    ))}
  </div>
);

const StatePanel = ({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) => (
  <div className="flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-16 text-center border-slate-800">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
      {icon}
    </div>
    <h2 className="text-lg font-bold text-slate-50">
      {title}
    </h2>
    <p className="mt-1 max-w-md text-sm text-slate-400">
      {description}
    </p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);

const Section = ({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section className="mb-12">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold sm:text-2xl text-slate-50">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const GameRow = ({
  games,
  ranked = false,
}: {
  games: GameItem[];
  ranked?: boolean;
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 1 | -1) =>
    trackRef.current?.scrollBy({ left: direction * 480, behavior: 'smooth' });

  const arrowClass =
    'absolute top-[32%] z-10 hidden h-10 w-10 items-center justify-center rounded-lg border shadow-md transition-opacity md:flex md:opacity-0 md:group-hover/row:opacity-100 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700';

  return (
    <div className="group/row relative">
      <div
        ref={trackRef}
        className={`-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2 ${HIDE_SCROLLBAR}`}
      >
        {games.map((game, index) => (
          <GameCard
            key={getGameKey(game)}
            game={game}
            rank={ranked ? index + 1 : undefined}
            className={ROW_ITEM}
          />
        ))}
      </div>

      <button
        type="button"
        aria-label="Geser ke kiri"
        onClick={() => scroll(-1)}
        className={`${arrowClass} -left-5`}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Geser ke kanan"
        onClick={() => scroll(1)}
        className={`${arrowClass} -right-5`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

const ChipGroup = ({
  label,
  options,
  value,
  onChange,
  tone,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (value: string | null) => void;
  tone: keyof typeof CHIP_TONE;
}) => (
  <div className="flex items-center gap-3">
    <span className="w-16 shrink-0 text-sm font-semibold text-slate-400">
      {label}
    </span>
    <div className={`flex gap-2 overflow-x-auto py-1 ${HIDE_SCROLLBAR}`}>
      {([null, ...options] as (string | null)[]).map((option) => {
        const isActive = option === value;

        return (
          <button
            key={option ?? 'all'}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option)}
            className={`h-10 shrink-0 rounded-full px-4 text-sm font-medium ring-1 transition-colors ${
              isActive
                ? CHIP_TONE[tone]
                : 'bg-slate-900 text-slate-300 ring-slate-700 hover:bg-slate-800'
            }`}
          >
            {option ?? 'Semua'}
          </button>
        );
      })}
    </div>
  </div>
);

const aspectScore = (game: Game, aspect: AspectKey) =>
  Number(game[ASPECT_FIELD[aspect]] ?? 0);

const AspectTile = ({
  game,
  aspect,
  large = false,
  className = '',
}: {
  game: Game;
  aspect: AspectKey;
  large?: boolean;
  className?: string;
}) => {
  const { openGame, isOpening } = useOpenGame();

  return (
    <button
      type="button"
      onClick={() => openGame(game)}
      disabled={isOpening}
      className={`group relative overflow-hidden rounded-xl bg-slate-800 text-left outline-none ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-70 ${className}`}
    >
      {game.cover_url && (
        <img
          src={game.cover_url}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
        />
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-slate-950/75 p-4 backdrop-blur-sm">
        <div className="min-w-0">
          <h3
            className={`line-clamp-1 font-bold text-slate-50 ${large ? 'text-xl' : 'text-base'}`}
          >
            {game.name}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-sm text-slate-400">
            {(game.genres ?? []).slice(0, 2).join(', ')}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-semibold text-violet-300">
            Unggul di {ASPECT_LABEL[aspect]}
          </p>
          <p
            className={`font-extrabold text-slate-50 ${large ? 'text-3xl' : 'text-xl'}`}
          >
            {aspectScore(game, aspect).toFixed(1)}
          </p>
        </div>
      </div>

      {isOpening && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
          <RefreshCw className="h-5 w-5 animate-spin text-white" />
        </div>
      )}
    </button>
  );
};

const GemCard = ({ game }: { game: Game }) => {
  const { openGame, isOpening } = useOpenGame();

  return (
    <button
      type="button"
      onClick={() => openGame(game)}
      disabled={isOpening}
      className="group flex flex-col overflow-hidden rounded-xl bg-slate-900 text-left outline-none ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-70"
    >
      <div className="relative h-36 w-full overflow-hidden bg-slate-800">
        {game.cover_url && (
          <img
            src={game.cover_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-slate-950/75 px-2.5 py-1 text-xs font-semibold text-violet-200 ring-1 ring-violet-300/30 backdrop-blur-sm">
          Hidden gem
        </span>
        {isOpening && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
            <RefreshCw className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-1 text-base font-bold text-slate-50 transition-colors group-hover:text-indigo-400">
          {game.name}
        </h3>
        <p className="mt-1 line-clamp-1 text-sm text-slate-400">
          {(game.genres ?? []).slice(0, 2).join(', ')}
        </p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 font-bold text-slate-50">
            <Star className="h-4 w-4 fill-violet-500 text-violet-500" />
            {Number(game.avgOverall ?? 0).toFixed(1)}
          </span>
          <span className="text-slate-400">{game.totalReviews ?? 0} review</span>
        </div>
      </div>
    </button>
  );
};

const AspectBar = ({ aspect, value }: { aspect: AspectKey; value: number }) => (
  <div className="flex items-center gap-3">
    <span className="w-16 shrink-0 text-xs text-slate-400">
      {ASPECT_LABEL[aspect]}
    </span>
    <div className="h-2 flex-1 rounded-full bg-slate-800">
      <div
        className={`h-2 rounded-full ${BAR_COLOR[aspect]}`}
        style={{ width: `${Math.min(Math.max(value, 0), 10) * 10}%` }}
      />
    </div>
    <span className="w-8 shrink-0 text-right text-xs font-bold text-slate-50">
      {value.toFixed(1)}
    </span>
  </div>
);

const ContrastCard = ({ item }: { item: AspectContrast }) => {
  const { openGame, isOpening } = useOpenGame();
  const { game, high, low } = item;

  return (
    <button
      type="button"
      onClick={() => openGame(game)}
      disabled={isOpening}
      className="flex gap-4 rounded-xl bg-slate-900 p-4 text-left outline-none ring-1 ring-white/10 transition-colors hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-70"
    >
      {game.cover_url ? (
        <img
          src={game.cover_url}
          alt=""
          loading="lazy"
          className="aspect-[2/3] w-20 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="aspect-[2/3] w-20 shrink-0 rounded-lg bg-slate-800" />
      )}

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 text-base font-bold text-slate-50">
          {game.name}
        </h3>
        <p className="mt-0.5 text-sm font-medium text-violet-300">
          {ASPECT_LABEL[high]} juara, {ASPECT_LABEL[low].toLowerCase()} biasa
        </p>
        <div className="mt-3 space-y-2">
          {ASPECT_TABS.map((tab) => (
            <AspectBar
              key={tab.key}
              aspect={tab.key}
              value={aspectScore(game, tab.key)}
            />
          ))}
        </div>
      </div>
    </button>
  );
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const SAVE_LABEL: Record<SaveState, string> = {
  idle: 'Plan to Play',
  saving: 'Menyimpan...',
  saved: 'Tersimpan',
  error: 'Gagal, coba lagi',
};

const formatReviewDate = (value: string | null) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const RecommendationBanner = ({ game }: { game: GameItem }) => {
  const { openGame, isOpening } = useOpenGame();
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const saveToLibrary = async () => {
    if (saveState === 'saving' || saveState === 'saved') return;

    try {
      setSaveState('saving');
      const target = isDatabaseGame(game)
        ? game
        : await gameService.importGame(game.igdb_id);
      await gameService.addToLibrary(Number(target.id), 'plan_to_play');
      setSaveState('saved');
    } catch (error) {
      console.error('Gagal menyimpan ke library:', error);
      setSaveState('error');
    }
  };

  return (
    <div className="flex gap-5 rounded-xl bg-slate-900 p-5 ring-1 ring-white/10">
      {game.cover_url ? (
        <img
          src={game.cover_url}
          alt={game.name}
          loading="lazy"
          className="aspect-[2/3] w-28 shrink-0 rounded-lg object-cover sm:w-32"
        />
      ) : (
        <div className="aspect-[2/3] w-28 shrink-0 rounded-lg bg-slate-800 sm:w-32" />
      )}

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="text-sm font-semibold text-violet-300">Layak dicoba</p>
        <h3 className="mt-1 line-clamp-2 text-xl font-extrabold text-slate-50">
          {game.name}
        </h3>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
          {[
            (game.genres ?? []).slice(0, 2).join(', '),
            (game.platforms ?? []).slice(0, 2).join(', '),
            game.release_year,
          ]
            .filter(Boolean)
            .map((item) => (
              <span key={item}>{item}</span>
            ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={saveToLibrary}
            disabled={saveState === 'saving' || saveState === 'saved'}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-80"
          >
            {saveState === 'saved' ? (
              <Check className="h-4 w-4" />
            ) : saveState === 'saving' ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {SAVE_LABEL[saveState]}
          </button>
          <button
            type="button"
            onClick={() => openGame(game)}
            disabled={isOpening}
            className="inline-flex h-11 items-center rounded-lg px-5 text-sm font-semibold text-slate-100 ring-1 ring-white/20 transition-colors hover:bg-white/10 disabled:opacity-70"
          >
            Detail
          </button>
        </div>
      </div>
    </div>
  );
};

const ReviewCard = ({ review }: { review: RecentReview }) => {
  const { openGame, isOpening } = useOpenGame();
  const { game } = review;
  const scores = [
    { label: 'Gameplay', value: review.ratingGameplay },
    { label: 'Story', value: review.ratingStory },
    { label: 'Visual', value: review.ratingVisual },
  ];

  return (
    <button
      type="button"
      onClick={() => openGame(game)}
      disabled={isOpening}
      className="flex flex-col gap-4 rounded-xl bg-slate-900 p-5 text-left outline-none ring-1 ring-white/10 transition-colors hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-70"
    >
      <div className="flex gap-4">
        {game.cover_url ? (
          <img
            src={game.cover_url}
            alt=""
            loading="lazy"
            className="aspect-[2/3] w-20 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="aspect-[2/3] w-20 shrink-0 rounded-lg bg-slate-800" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-1 text-base font-bold text-slate-50">
                {game.name}
              </h3>
              {game.release_year && (
                <p className="text-xs text-slate-400">{game.release_year}</p>
              )}
            </div>
            <span className="flex shrink-0 items-center gap-1 font-bold text-slate-50">
              <Star className="h-4 w-4 fill-violet-500 text-violet-500" />
              {review.ratingOverall.toFixed(1)}
            </span>
          </div>
          <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-300">
            {review.reviewText}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {scores.map((score) => (
          <span
            key={score.label}
            className="rounded-full px-2.5 py-1 text-xs font-medium text-slate-300 ring-1 ring-white/15"
          >
            {score.label} {score.value.toFixed(1)}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-slate-400">
        <span className="flex min-w-0 items-center gap-2">
          {review.userAvatar ? (
            <img
              src={review.userAvatar}
              alt=""
              className="h-7 w-7 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              {review.userName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="line-clamp-1 font-semibold text-slate-100">
            {review.userName}
          </span>
        </span>
        <span className="shrink-0">{formatReviewDate(review.dateAdded)}</span>
        <span className="shrink-0">{review.helpfulCount} berguna</span>
      </div>
    </button>
  );
};

const RankRow = ({
  game,
  rank,
  detail,
}: {
  game: Game;
  rank: number;
  detail: string;
}) => {
  const { openGame, isOpening } = useOpenGame();

  return (
    <button
      type="button"
      onClick={() => openGame(game)}
      disabled={isOpening}
      className="group flex w-full items-center gap-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-70"
    >
      <span className="w-5 shrink-0 text-sm font-bold text-slate-500">
        {rank}
      </span>
      {game.cover_url ? (
        <img
          src={game.cover_url}
          alt=""
          loading="lazy"
          className="aspect-[2/3] w-10 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="aspect-[2/3] w-10 shrink-0 rounded bg-slate-800" />
      )}
      <div className="min-w-0">
        <p className="line-clamp-1 text-sm font-semibold text-slate-100 transition-colors group-hover:text-indigo-400">
          {game.name}
        </p>
        <p className="text-xs text-slate-400">{detail}</p>
      </div>
    </button>
  );
};

const RankColumn = ({
  title,
  games,
  detail,
}: {
  title: string;
  games: Game[];
  detail: (game: Game) => string;
}) => (
  <div>
    <h3 className="mb-2 border-b-2 border-indigo-500 pb-2 text-lg font-extrabold text-slate-50">
      {title}
    </h3>
    <div className="divide-y divide-white/5">
      {games.map((game, index) => (
        <RankRow
          key={game.id}
          game={game}
          rank={index + 1}
          detail={detail(game)}
        />
      ))}
    </div>
  </div>
);

const HeroPick = ({ game, rank }: { game: Game; rank: number }) => {
  const { openGame, isOpening } = useOpenGame();

  return (
    <button
      type="button"
      onClick={() => openGame(game)}
      disabled={isOpening}
      className="flex w-56 shrink-0 items-center gap-3 rounded-lg p-2 text-left ring-1 transition-colors disabled:opacity-70 bg-white/5 ring-white/10 hover:bg-white/10"
    >
      {game.cover_url ? (
        <img
          src={game.cover_url}
          alt=""
          className="aspect-[2/3] w-10 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="aspect-[2/3] w-10 shrink-0 rounded bg-white/10" />
      )}
      <div className="min-w-0">
        <p className="line-clamp-1 text-sm font-semibold text-white">
          {game.name}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-300">
          <span className="font-semibold text-violet-200">
            #{rank}
          </span>
          <Star className="h-3 w-3 fill-violet-300 text-violet-300" />
          {Number(game.avgOverall ?? 0).toFixed(1)}
        </p>
      </div>
    </button>
  );
};

const Hero = ({
  game,
  picks,
  onSearchClick,
}: {
  game: Game;
  picks: Game[];
  onSearchClick: () => void;
}) => {
  const { openGame, isOpening } = useOpenGame();
  const platforms = (game.platforms ?? []).slice(0, 3).join(', ');

  return (
    <section className="relative mb-12 overflow-hidden rounded-2xl shadow-sm ring-1 bg-indigo-950 text-white ring-white/10">
      {game.cover_url && (
        <img
          src={game.cover_url}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-125 object-cover blur-2xl opacity-50"
        />
      )}
      <div className="absolute inset-0 bg-slate-950/60" />

      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:gap-8 sm:p-10">
        {game.cover_url && (
          <img
            src={game.cover_url}
            alt={game.name}
            className="aspect-[2/3] w-32 shrink-0 rounded-xl object-cover ring-1 sm:w-44 shadow-2xl ring-white/15"
          />
        )}

        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 bg-violet-500/25 text-violet-100 ring-violet-300/30">
            <Trophy className="h-3.5 w-3.5" />
            Overall terbaik
          </span>

          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {game.name}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-200">
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-violet-300 text-violet-300" />
              <span className="text-xl font-bold text-white">
                {Number(game.avgOverall ?? 0).toFixed(1)}
              </span>
              <span className="text-slate-300">/ 10</span>
            </span>
            <span>{game.totalReviews ?? 0} review</span>
            {game.release_year && <span>Rilis {game.release_year}</span>}
            {platforms && <span>{platforms}</span>}
          </div>

          {(game.genres ?? []).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {(game.genres ?? []).map((genre) => (
                <span
                  key={genre}
                  className="rounded-full px-3 py-1 text-xs font-medium ring-1 bg-white/10 text-slate-100 ring-white/15"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => openGame(game)}
              disabled={isOpening}
              className="inline-flex h-11 items-center gap-2 rounded-lg px-6 text-sm font-semibold text-white transition-colors disabled:opacity-70 bg-indigo-500 hover:bg-indigo-400"
            >
              {isOpening && <RefreshCw className="h-4 w-4 animate-spin" />}
              Lihat detail
            </button>
            <button
              type="button"
              onClick={onSearchClick}
              className="inline-flex h-11 items-center gap-2 rounded-lg px-5 text-sm font-semibold ring-1 transition-colors bg-white/10 text-white ring-white/20 hover:bg-white/15"
            >
              <Search className="h-4 w-4" />
              Cari game lain
            </button>
          </div>
        </div>
      </div>

      {picks.length > 0 && (
        <div className="relative border-t px-6 py-4 sm:px-10 border-white/10 bg-slate-950/40">
          <p className="mb-3 text-sm font-semibold text-slate-300">
            Peringkat berikutnya
          </p>
          <div className={`flex gap-3 overflow-x-auto ${HIDE_SCROLLBAR}`}>
            {picks.map((pick, index) => (
              <HeroPick key={pick.id} game={pick} rank={index + 2} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default function GameList() {
  const [overallGames, setOverallGames] = useState<Game[]>([]);
  const [gameplayGames, setGameplayGames] = useState<Game[]>([]);
  const [storyGames, setStoryGames] = useState<Game[]>([]);
  const [visualGames, setVisualGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [recommendedGames, setRecommendedGames] = useState<GameItem[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(true);
  const [hasRecommendationError, setHasRecommendationError] = useState(false);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  const [recentGames, setRecentGames] = useState<Game[]>(readRecentGames);
  const [activeAspect, setActiveAspect] = useState<AspectKey>('gameplay');
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GameItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const requestIdRef = useRef(0);
  const lastQueryRef = useRef('');
  const searchRef = useRef<HTMLInputElement>(null);

  const runSearch = async (rawQuery: string) => {
    const query = rawQuery.trim();
    const requestId = ++requestIdRef.current;
    lastQueryRef.current = query;

    if (!query) {
      setActiveQuery('');
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setActiveQuery(query);
    setIsSearching(true);

    try {
      const results = await gameService.searchGames(query);
      if (requestId !== requestIdRef.current) return;
      setSearchResults(results);
    } catch (error) {
      console.error('Gagal mencari game:', error);
      if (requestId !== requestIdRef.current) return;
      setSearchResults([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsSearching(false);
      }
    }
  };

  useEffect(() => {
    const query = searchInput.trim();

    if (!query || query === lastQueryRef.current) return;

    const timer = setTimeout(() => runSearch(query), 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);

    if (value.trim() === '') {
      runSearch('');
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    runSearch('');
  };

  const focusSearch = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    searchRef.current?.focus();
  };

  const clearRecentGames = () => {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      return;
    } finally {
      setRecentGames([]);
    }
  };

  const loadTopRated = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const { overall, gameplay, story, visual } =
        await gameService.getTopRatedSummary();

      setOverallGames(overall);
      setGameplayGames(gameplay);
      setStoryGames(story);
      setVisualGames(visual);
    } catch (error) {
      console.error('Gagal mengambil rating terbaik:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopRated();
  }, [loadTopRated]);

  const loadRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true);
    setHasRecommendationError(false);

    try {
      setRecommendedGames(await gameService.getRecommendedGames(24));
    } catch (error) {
      console.error('Gagal mengambil rekomendasi:', error);
      setHasRecommendationError(true);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  useEffect(() => {
    gameService
      .getRecentReviews(4)
      .then(setRecentReviews)
      .catch((error) => console.error('Gagal mengambil review terbaru:', error))
      .finally(() => setIsLoadingReviews(false));
  }, []);

  const allGames = useMemo(() => {
    const unique = new Map<Game['id'], Game>();
    [...overallGames, ...gameplayGames, ...storyGames, ...visualGames].forEach(
      (game) => unique.set(game.id, game)
    );
    return Array.from(unique.values());
  }, [overallGames, gameplayGames, storyGames, visualGames]);

  const visibleRecommendations = useMemo(() => {
    const reviewedIgdbIds = new Set(allGames.map((game) => game.igdb_id));
    return recommendedGames
      .filter((game) => !reviewedIgdbIds.has(game.igdb_id))
      .slice(0, 12);
  }, [recommendedGames, allGames]);

  const newestGames = useMemo(
    () =>
      [...allGames]
        .sort((a, b) => Number(b.release_year ?? 0) - Number(a.release_year ?? 0))
        .slice(0, 12),
    [allGames]
  );

  const aspectHighlights = useMemo(() => {
    const used = new Set<Game['id']>();
    const order: AspectKey[] = ['gameplay', 'story', 'visual', 'story', 'gameplay'];

    return order.flatMap((aspect) => {
      const pick = allGames
        .filter((game) => aspectScore(game, aspect) > 0)
        .sort((a, b) => aspectScore(b, aspect) - aspectScore(a, aspect))
        .find((game) => !used.has(game.id));

      if (!pick) return [];

      used.add(pick.id);
      return [{ game: pick, aspect }];
    });
  }, [allGames]);

  const hiddenGems = useMemo(() => {
    const reviewed = allGames.filter((game) => (game.totalReviews ?? 0) > 0);
    if (reviewed.length < 4) return [];

    const counts = reviewed
      .map((game) => game.totalReviews ?? 0)
      .sort((a, b) => a - b);
    const median = counts[Math.floor(counts.length / 2)];

    return reviewed
      .filter(
        (game) =>
          (game.totalReviews ?? 0) <= median &&
          Number(game.avgOverall ?? 0) >= GEM_MIN_SCORE
      )
      .sort((a, b) => Number(b.avgOverall ?? 0) - Number(a.avgOverall ?? 0))
      .slice(0, 4);
  }, [allGames]);

  const aspectContrasts = useMemo(() => {
    const items: (AspectContrast & { gap: number })[] = [];

    allGames.forEach((game) => {
      const scores = ASPECT_TABS.map((tab) => ({
        key: tab.key,
        value: aspectScore(game, tab.key),
      }));

      if (scores.some((score) => score.value <= 0)) return;

      const sorted = [...scores].sort((a, b) => b.value - a.value);
      items.push({
        game,
        high: sorted[0].key,
        low: sorted[2].key,
        gap: sorted[0].value - sorted[2].value,
      });
    });

    return items
      .filter((item) => item.gap >= CONTRAST_MIN_GAP)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 3);
  }, [allGames]);

  const mostReviewedGames = useMemo(
    () =>
      [...allGames]
        .sort((a, b) => (b.totalReviews ?? 0) - (a.totalReviews ?? 0))
        .slice(0, 12),
    [allGames]
  );

  const platforms = useMemo(
    () => rankByFrequency(allGames.flatMap((game) => game.platforms ?? [])),
    [allGames]
  );

  const genres = useMemo(
    () => rankByFrequency(allGames.flatMap((game) => game.genres ?? [])),
    [allGames]
  );

  const exploreGames = useMemo(
    () =>
      allGames
        .filter(
          (game) =>
            (!activePlatform ||
              (game.platforms ?? []).includes(activePlatform)) &&
            (!activeGenre || (game.genres ?? []).includes(activeGenre))
        )
        .slice(0, 10),
    [allGames, activePlatform, activeGenre]
  );

  const aspectGames: Record<AspectKey, Game[]> = {
    gameplay: gameplayGames,
    story: storyGames,
    visual: visualGames,
  };

  const renderRecommendationRow = () => {
    if (isLoadingRecommendations) return <RowSkeleton />;

    if (hasRecommendationError || visibleRecommendations.length === 0) {
      return (
        <p className="text-sm text-slate-400">
          Rekomendasi belum bisa dimuat. Tekan “Acak lagi” untuk mencoba lagi.
        </p>
      );
    }

    const banners = visibleRecommendations.slice(0, 2);
    const rest = visibleRecommendations.slice(2);

    return (
      <>
        <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {banners.map((game) => (
            <RecommendationBanner key={getGameKey(game)} game={game} />
          ))}
        </div>
        {rest.length > 0 && <GameRow games={rest} />}
      </>
    );
  };

  const renderRecommendations = () => (
    <Section
      title="Rekomendasi acak"
      subtitle="Pilihan acak dari IGDB, termasuk game yang belum punya review."
      action={
        <button
          type="button"
          onClick={loadRecommendations}
          disabled={isLoadingRecommendations}
          className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold shadow-sm transition-colors disabled:opacity-60 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoadingRecommendations ? 'animate-spin' : ''}`}
          />
          Acak lagi
        </button>
      }
    >
      {renderRecommendationRow()}
    </Section>
  );

  const renderSearchResults = () => {
    if (isSearching) return <SearchSkeleton />;

    if (searchResults.length === 0) {
      return (
        <StatePanel
          icon={<Gamepad2 className="h-6 w-6" />}
          title={`Tidak ada game dengan judul “${activeQuery}”`}
          description="Periksa penulisan judulnya atau coba kata kunci yang lebih singkat."
          action={
            <button
              type="button"
              onClick={clearSearch}
              className="h-11 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Hapus pencarian
            </button>
          }
        />
      );
    }

    return (
      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold sm:text-2xl text-slate-50">
            Hasil untuk “{activeQuery}”
          </h2>
          <span className="shrink-0 text-sm text-slate-400">
            {searchResults.length} game
          </span>
        </div>

        <div className={GRID}>
          {searchResults.map((game) => (
            <GameCard key={game.igdb_id} game={game} />
          ))}
        </div>
      </section>
    );
  };

  const renderHome = () => {
    if (isLoading) return <HomeSkeleton />;

    if (hasError) {
      return (
        <StatePanel
          icon={<RefreshCw className="h-6 w-6" />}
          title="Daftar game belum bisa dimuat"
          description="Koneksi ke server bermasalah. Periksa koneksimu lalu coba lagi."
          action={
            <button
              type="button"
              onClick={loadTopRated}
              className="h-11 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Coba lagi
            </button>
          }
        />
      );
    }

    if (allGames.length === 0) {
      return (
        <>
          <div className="mb-12">
            <StatePanel
              icon={<Gamepad2 className="h-6 w-6" />}
              title="Belum ada game yang direview"
              description="Cari game yang baru kamu mainkan, lalu jadilah yang pertama menulis review."
              action={
                <button
                  type="button"
                  onClick={focusSearch}
                  className="h-11 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  Cari game
                </button>
              }
            />
          </div>
          {renderRecommendations()}
        </>
      );
    }

    const hasEnoughGames = allGames.length >= 4;

    return (
      <>
        {overallGames[0] && (
          <Hero
            game={overallGames[0]}
            picks={overallGames.slice(1, 5)}
            onSearchClick={focusSearch}
          />
        )}

        {recentGames.length > 0 && (
          <Section
            title="Terakhir dilihat"
            subtitle="Lanjutkan dari game yang baru kamu buka."
            action={
              <button
                type="button"
                onClick={clearRecentGames}
                className="text-sm font-medium transition-colors text-indigo-400 hover:text-indigo-300"
              >
                Bersihkan
              </button>
            }
          >
            <GameRow games={recentGames} />
          </Section>
        )}

        {overallGames.length > 0 && (
          <Section
            title="Overall terbaik"
            subtitle="Nilai keseluruhan tertinggi dari para reviewer."
          >
            <GameRow games={overallGames} ranked />
          </Section>
        )}

        {aspectHighlights.length >= 3 && (
          <Section
            title="Sorotan aspek"
            subtitle="Satu game, satu keunggulan: dipilih dari rating tiap aspek."
          >
            <div className="grid auto-rows-[10rem] grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {aspectHighlights.map(({ game, aspect }, index) => {
                const isLarge = aspectHighlights.length === 5 && index === 0;

                return (
                  <AspectTile
                    key={game.id}
                    game={game}
                    aspect={aspect}
                    large={isLarge}
                    className={isLarge ? 'sm:col-span-2 md:row-span-2' : ''}
                  />
                );
              })}
            </div>
          </Section>
        )}

        {renderRecommendations()}

        {hiddenGems.length >= 2 && (
          <Section
            title="Hidden gems"
            subtitle="Nilai tinggi, tapi belum banyak yang membahasnya."
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {hiddenGems.map((game) => (
                <GemCard key={game.id} game={game} />
              ))}
            </div>
          </Section>
        )}

        {(isLoadingReviews || recentReviews.length > 0) && (
          <Section
            title="Review terbaru"
            subtitle="Dari para pemain, lengkap dengan rating tiap aspek."
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {isLoadingReviews
                ? Array.from({ length: 2 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-52 animate-pulse rounded-xl bg-slate-800"
                    />
                  ))
                : recentReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
            </div>
          </Section>
        )}

        {aspectContrasts.length > 0 && (
          <Section
            title="Jurang antar aspek"
            subtitle="Unggul di satu sisi, biasa saja di sisi lain."
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {aspectContrasts.map((item) => (
                <ContrastCard key={item.game.id} item={item} />
              ))}
            </div>
          </Section>
        )}

        <Section
          title="Terbaik per aspek"
          subtitle="Game yang unggul di satu aspek belum tentu unggul di aspek lain."
          action={
            <div
              role="tablist"
              className="inline-flex rounded-lg p-1 bg-slate-800"
            >
              {ASPECT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeAspect === tab.key}
                  onClick={() => setActiveAspect(tab.key)}
                  className={`h-9 rounded-md px-4 text-sm font-semibold transition-colors ${
                    activeAspect === tab.key
                      ? 'shadow-sm bg-slate-700 text-indigo-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          }
        >
          {aspectGames[activeAspect].length > 0 ? (
            <GameRow games={aspectGames[activeAspect]} ranked />
          ) : (
            <p className="text-sm text-slate-400">
              Belum ada game dengan rating pada aspek ini.
            </p>
          )}
        </Section>

        {hasEnoughGames && (
          <Section
            title="Papan peringkat"
            subtitle="Tiga cara melihat game yang sedang ramai."
          >
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <RankColumn
                title="Rating tertinggi"
                games={overallGames.slice(0, 5)}
                detail={(game) =>
                  `Overall ${Number(game.avgOverall ?? 0).toFixed(1)}`
                }
              />
              <RankColumn
                title="Paling banyak diulas"
                games={mostReviewedGames.slice(0, 5)}
                detail={(game) => `${game.totalReviews ?? 0} review`}
              />
              <RankColumn
                title="Rilis terbaru"
                games={newestGames.slice(0, 5)}
                detail={(game) => `Rilis ${game.release_year ?? 'tidak diketahui'}`}
              />
            </div>
          </Section>
        )}

        <Section
          title="Jelajahi koleksi"
          subtitle="Saring berdasarkan platform dan genre."
        >
          <div className="mb-6 space-y-2">
            <ChipGroup
              label="Platform"
              options={platforms}
              value={activePlatform}
              onChange={setActivePlatform}
              tone="indigo"
            />
            <ChipGroup
              label="Genre"
              options={genres}
              value={activeGenre}
              onChange={setActiveGenre}
              tone="violet"
            />
          </div>

          {exploreGames.length > 0 ? (
            <div className={GRID}>
              {exploreGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Belum ada game dengan kombinasi platform dan genre ini.
            </p>
          )}
        </Section>
      </>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-violet-400">
            {getGreeting()}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-slate-50">
            Mau main apa hari ini?
          </h1>
        </div>

        <Link
          to="/stats"
          className="inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-semibold shadow-sm transition-colors border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
        >
          <TrendingUp className="h-4 w-4" />
          Statistik
        </Link>
      </header>

      <div className="relative mb-10">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          ref={searchRef}
          type="text"
          aria-label="Cari game"
          placeholder="Cari judul game..."
          value={searchInput}
          onChange={(event) => handleSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') runSearch(searchInput);
          }}
          className="h-12 w-full rounded-xl border pl-12 pr-32 shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500"
        />

        {searchInput && (
          <button
            type="button"
            aria-label="Hapus pencarian"
            onClick={clearSearch}
            className="absolute right-24 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => runSearch(searchInput)}
          disabled={isSearching}
          className="absolute right-1.5 top-1.5 flex h-9 w-20 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Cari'}
        </button>
      </div>

      {activeQuery ? renderSearchResults() : renderHome()}
    </div>
  );
}