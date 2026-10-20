import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  RefreshCw,
  Search,
  Star,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react';
import { gameService } from '../services/gameService';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const [overall, gameplay, story, visual] = await Promise.all([
        gameService.getTopRatedGames('overall'),
        gameService.getTopRatedGames('gameplay'),
        gameService.getTopRatedGames('story'),
        gameService.getTopRatedGames('visual'),
      ]);

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

    return <GameRow games={visibleRecommendations} />;
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

        {renderRecommendations()}

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
            title="Baru dirilis"
            subtitle="Rilisan terbaru yang sudah punya review."
          >
            <GameRow games={newestGames} />
          </Section>
        )}

        {hasEnoughGames && (
          <Section
            title="Paling banyak diulas"
            subtitle="Game yang paling ramai dibahas pemain lain."
          >
            <GameRow games={mostReviewedGames} />
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