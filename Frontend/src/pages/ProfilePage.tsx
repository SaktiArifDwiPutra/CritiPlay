import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Calendar,
  Gamepad2,
  Trophy,
  Sparkles,
  Settings,
  Activity,
  Plus,
  Loader2,
  Camera,
  X,
  ExternalLink,
  Crown,
  Star,
  Trash2,
  Search,
  Check,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { libraryService, type LibraryGame } from '../services/libraryService';
import { getStorageUrl } from '../config/api';
import type { SearchUser, GamerStats } from '../types';
import { GamerBadgePill, getTierConfig } from '../components/GamerBadge';

type LibraryStats = {
  total_games: number;
  completed: number;
  playing: number;
  plan_to_play: number;
  dropped: number;
};

type AvgRatings = {
  gameplay: number;
  story: number;
  visual: number;
  overall: number;
};

type ProfileData = {
  user: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    joined_at: string;
    followers_count?: number;
    following_count?: number;
    showcase_game_ids?: number[];
  };
  stats: {
    library: LibraryStats;
    total_reviews: number;
    avg_ratings?: AvgRatings;
  };
  recent_activity: RecentGame[];
  gamer_stats?: GamerStats;
};

type RecentGame = {
  id: number;
  name: string;
  cover_url: string | null;
  release_year: string | null;
  genres: string[];
  platforms: string[];
  pivot?: {
    status: 'plan_to_play' | 'playing' | 'completed' | 'dropped';
    created_at?: string;
    updated_at?: string;
  };
};

const statusLabel = {
  completed: 'Completed',
  playing: 'Playing',
  plan_to_play: 'Plan to Play',
  dropped: 'Dropped',
};

const statusBadge = {
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  playing: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  plan_to_play: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  dropped: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export default function ProfilePage() {
  const navigate = useNavigate();

  // Navigation tab: 'overview' | 'activity' | 'settings'
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'settings'>('overview');

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Followers / Following
  const [followers, setFollowers] = useState<SearchUser[]>([]);
  const [following, setFollowing] = useState<SearchUser[]>([]);
  const [socialModalType, setSocialModalType] = useState<'followers' | 'following' | null>(null);
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  // Showcase / Favorite Games state
  const [favoriteGames, setFavoriteGames] = useState<LibraryGame[]>([]);
  const [isFavModalOpen, setIsFavModalOpen] = useState(false);
  const [allLibraryGames, setAllLibraryGames] = useState<LibraryGame[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [favSearchQuery, setFavSearchQuery] = useState('');
  const [showXpBreakdown, setShowXpBreakdown] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const data: ProfileData = await authService.getProfile();
        if (!isMounted) return;
        setProfile(data);
        setName(data.user.name);
        setEmail(data.user.email);
        setAvatar(data.user.avatar);
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError('Gagal mengambil data profile.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!profile) return;

    let targetIds: number[] = [];
    if (Array.isArray(profile.user.showcase_game_ids) && profile.user.showcase_game_ids.length > 0) {
      targetIds = profile.user.showcase_game_ids.map(Number);
      localStorage.setItem(`critiplay_favs_${profile.user.id}`, JSON.stringify(targetIds));
    } else {
      const savedFavIds = localStorage.getItem(`critiplay_favs_${profile.user.id}`);
      if (savedFavIds) {
        try {
          targetIds = JSON.parse(savedFavIds).map(Number);
          if (targetIds.length > 0) {
            userService.updateShowcase(targetIds).catch(console.error);
          }
        } catch (e) {
          console.error('Error parsing favs:', e);
        }
      }
    }

    if (targetIds.length > 0) {
      libraryService
        .getLibrary('all')
        .then((libraryGames) => {
          setAllLibraryGames(libraryGames);
          const favs = libraryGames.filter((g) => targetIds.includes(Number(g.id)));
          setFavoriteGames(favs);
        })
        .catch((e) => console.error('Error loading favs:', e));
    }
  }, [profile?.user.id, profile?.user.showcase_game_ids]);

  // Auto-load followers & following when Activity tab is activated
  useEffect(() => {
    if (activeTab !== 'activity' || !profile) return;
    const uid = String(profile.user.id);
    if (followers.length === 0) {
      userService.getFollowers(uid).then(setFollowers).catch(console.error);
    }
    if (following.length === 0) {
      userService.getFollowing(uid).then(setFollowing).catch(console.error);
    }
  }, [activeTab, profile?.user.id]);

  const handleOpenSocialModal = async (type: 'followers' | 'following') => {
    setSocialModalType(type);
    if (!profile) return;

    if (type === 'followers' && followers.length === 0) {
      setIsSocialLoading(true);
      try {
        const data = await userService.getFollowers(String(profile.user.id));
        setFollowers(data);
      } catch (err) {
        console.error('Gagal mengambil followers:', err);
      } finally {
        setIsSocialLoading(false);
      }
    } else if (type === 'following' && following.length === 0) {
      setIsSocialLoading(true);
      try {
        const data = await userService.getFollowing(String(profile.user.id));
        setFollowing(data);
      } catch (err) {
        console.error('Gagal mengambil following:', err);
      } finally {
        setIsSocialLoading(false);
      }
    }
  };

  const handleOpenFavModal = async () => {
    setIsFavModalOpen(true);
    if (allLibraryGames.length === 0) {
      setIsLibraryLoading(true);
      try {
        const games = await libraryService.getLibrary('all');
        setAllLibraryGames(games);
      } catch (e) {
        console.error('Failed to load library for favorites:', e);
      } finally {
        setIsLibraryLoading(false);
      }
    }
  };

  const toggleFavoriteGame = async (game: LibraryGame) => {
    if (!profile) return;
    const isAlreadyFav = favoriteGames.some((g) => g.id === game.id);

    let nextFavs: LibraryGame[] = [];
    if (isAlreadyFav) {
      nextFavs = favoriteGames.filter((g) => g.id !== game.id);
    } else {
      if (favoriteGames.length >= 4) {
        alert('Maksimal 4 game favorit yang bisa disematkan.');
        return;
      }
      nextFavs = [...favoriteGames, game];
    }

    setFavoriteGames(nextFavs);
    const ids = nextFavs.map((g) => Number(g.id));
    localStorage.setItem(
      `critiplay_favs_${profile.user.id}`,
      JSON.stringify(ids)
    );
    try {
      await userService.updateShowcase(ids);
    } catch (e) {
      console.error('Failed to sync showcase to server:', e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);

      if (selectedFile) {
        formData.append('avatar', selectedFile);
      }

      const res = await authService.updateProfile(formData);
      setMessage('Profil berhasil diperbarui!');

      if (res.user.avatar) {
        setAvatar(res.user.avatar);
      }

      setSelectedFile(null);
      setPreviewUrl(null);

      // Refresh profile data
      const data: ProfileData = await authService.getProfile();
      setProfile(data);
      setName(data.user.name);
      setEmail(data.user.email);
      setAvatar(data.user.avatar);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl py-24 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500 mb-3" />
        <p className="text-sm font-medium text-slate-400">
          Memuat profil kamu...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-6xl py-24 text-center">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-red-400">
          <p className="font-semibold">{error || 'Profil tidak ditemukan.'}</p>
        </div>
      </div>
    );
  }

  const library = profile.stats.library;
  const total = library.total_games;

  // Gamer level & stats from backend (or fallback)
  const gamerStats: GamerStats = profile.gamer_stats || {
    level: 1,
    xp: library.completed * 30 + profile.stats.total_reviews * 50 + library.playing * 10,
    current_level_xp: 0,
    next_level_xp: 60,
    xp_needed: 60,
    progress_percent: 10,
    badge: {
      tier: 'bronze',
      title: 'Novice Explorer',
      color: '#CD7F32',
    },
  };

  const tierCfg = getTierConfig(gamerStats.badge?.tier);

  // Donut chart calculations
  const completedPercent = total > 0 ? (library.completed / total) * 100 : 0;
  const playingPercent = total > 0 ? (library.playing / total) * 100 : 0;
  const planPercent = total > 0 ? (library.plan_to_play / total) * 100 : 0;
  const droppedPercent = total > 0 ? (library.dropped / total) * 100 : 0;

  const completedEnd = completedPercent;
  const playingEnd = completedEnd + playingPercent;
  const planEnd = playingEnd + planPercent;
  const droppedEnd = planEnd + droppedPercent;

  const donutBackground =
    total > 0
      ? `conic-gradient(
          #10b981 0% ${completedEnd}%,
          #6366f1 ${completedEnd}% ${playingEnd}%,
          #f59e0b ${playingEnd}% ${planEnd}%,
          #f43f5e ${planEnd}% ${droppedEnd}%
        )`
      : '#1e293b';

  return (
    <div className="mx-auto max-w-6xl pb-16">

      {/* ================= HERO PROFILE HEADER ================= */}
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 sm:p-8 shadow-xl backdrop-blur-md">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* AVATAR WITH BADGE */}
            <div className="relative group shrink-0">
              <div className={`h-24 w-24 rounded-2xl bg-slate-800 p-0.5 overflow-hidden shadow-lg ${tierCfg.ringStyle}`}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : avatar ? (
                  <img
                    src={getStorageUrl(avatar) || undefined}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-indigo-700 to-purple-700 text-3xl font-extrabold text-white">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                title="Ganti Foto Profil"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 shadow-md transition-all hover:scale-110 hover:border-indigo-400 hover:text-white"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* USER INFO & BADGE */}
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {profile.user.name}
                </h1>

                {/* Gamer Rank Badge */}
                <GamerBadgePill stats={gamerStats} size="sm" />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  {profile.user.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  Bergabung sejak {profile.user.joined_at}
                </span>
              </div>

              {/* XP LEVEL PROGRESS BAR */}
              <div className="mt-3.5 max-w-md rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                  <span className="flex items-center gap-1 text-amber-300">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    Level {gamerStats.level} ({gamerStats.xp} Total XP)
                  </span>
                  <span className="text-slate-400">
                    {gamerStats.progress_percent}%
                  </span>
                </div>

                {/* Progress track */}
                <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-indigo-500 transition-all duration-700"
                    style={{ width: `${gamerStats.progress_percent}%` }}
                  />
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    {gamerStats.xp_needed > 0
                      ? `${gamerStats.xp_needed} XP lagi menuju Level ${gamerStats.level + 1}`
                      : 'Level Maksimal'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowXpBreakdown(!showXpBreakdown)}
                    className="flex items-center gap-0.5 text-indigo-400 hover:text-indigo-300"
                  >
                    <span>Cara Dapat XP</span>
                    {showXpBreakdown ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                  </button>
                </div>

                {/* Collapsible XP Guide */}
                {showXpBreakdown && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-300 grid grid-cols-2 gap-1.5">
                    <span className="flex items-center gap-1 text-slate-400">
                      📝 Tulis Review: <strong className="text-amber-300">+50 XP</strong>
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      🏆 Selesaikan Game: <strong className="text-emerald-300">+30 XP</strong>
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      🎮 Mainkan Game: <strong className="text-indigo-300">+10 XP</strong>
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      🌟 Vote Helpful: <strong className="text-amber-300">+15 XP</strong>
                    </span>
                    <span className="col-span-2 flex items-center gap-1 text-slate-400">
                      💬 Komentar Diskusi: <strong className="text-sky-300">+5 XP</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* FOLLOWER / FOLLOWING BUTTONS */}
              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleOpenSocialModal('followers')}
                  className="group flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-1.5 text-xs transition-all hover:border-slate-700 hover:bg-slate-800 active:scale-95"
                >
                  <span className="font-extrabold text-white group-hover:text-indigo-400 transition-colors">
                    {profile.user.followers_count ?? followers.length}
                  </span>
                  <span className="text-slate-400">Followers</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenSocialModal('following')}
                  className="group flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-1.5 text-xs transition-all hover:border-slate-700 hover:bg-slate-800 active:scale-95"
                >
                  <span className="font-extrabold text-white group-hover:text-indigo-400 transition-colors">
                    {profile.user.following_count ?? following.length}
                  </span>
                  <span className="text-slate-400">Following</span>
                </button>
              </div>
            </div>
          </div>

          {/* QUICK STATS CARDS */}
          <div className="flex gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-center min-w-[105px]">
              <p className="text-2xl font-extrabold text-indigo-400">
                {library.total_games}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-400">
                Koleksi Game
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-center min-w-[105px]">
              <p className="text-2xl font-extrabold text-purple-400">
                {profile.stats.total_reviews}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-400">
                Ulasan Dibuat
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TABBED NAVIGATION ================= */}
      <div className="mb-8 flex gap-2 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/60 p-1.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-95 ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Overview & Koleksi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-95 ${
            activeTab === 'activity'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Aktivitas & Teman</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-95 ${
            activeTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Pengaturan Akun</span>
        </button>
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* 1. FAVORITE GAMES SHOWCASE — HALL OF FAME */}
          <section className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
            {/* Ambient backlight glow */}
            <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

            {/* Header */}
            <div className="relative mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-400/20 to-amber-600/10 shadow-lg shadow-amber-500/10">
                  <Trophy className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                      Hall of Fame
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                      <Sparkles className="h-3 w-3 text-amber-400" />
                      {favoriteGames.length}/4 Terisi
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Empat karya game terbaik pilihanmu yang mendefinisikan selera bermainmu.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenFavModal}
                className="group flex items-center gap-2 rounded-xl border border-amber-500/30 bg-slate-800/90 px-4 py-2 text-xs font-bold text-amber-200 shadow-md transition-all hover:scale-105 hover:border-amber-400 hover:bg-amber-500/10 hover:text-white active:scale-95"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400 transition-transform group-hover:rotate-12" />
                <span>Atur Showcase</span>
              </button>
            </div>

            {/* 4-Slot Trophy Shelf Grid */}
            <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
              {[0, 1, 2, 3].map((slotIndex) => {
                const game = favoriteGames[slotIndex];
                const rankNumber = slotIndex + 1;

                if (game) {
                  const isTopPick = slotIndex === 0;
                  return (
                    <div
                      key={game.id}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-950/90 shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10"
                    >
                      {/* Cover Poster */}
                      <div className="relative block aspect-[3/4] w-full overflow-hidden bg-slate-900">
                        {game.cover_url ? (
                          <img
                            src={game.cover_url}
                            alt={game.name}
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-600">
                            <Gamepad2 className="h-8 w-8" />
                          </div>
                        )}

                        {/* Glossy gradient overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90" />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-60" />

                        {/* Rank Badge (Top Left) */}
                        <div className="absolute top-2.5 left-2.5 z-10">
                          {isTopPick ? (
                            <div className="flex items-center gap-1 rounded-lg border border-amber-300/40 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 px-2 py-0.5 text-[10px] font-black tracking-wider text-slate-950 shadow-md shadow-amber-500/40">
                              <Crown className="h-3 w-3 fill-slate-950" />
                              <span>#1 TOP PICK</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-amber-200 backdrop-blur-md shadow">
                              <Trophy className="h-3 w-3 text-amber-400" />
                              <span>#{rankNumber}</span>
                            </div>
                          )}
                        </div>

                        {/* Rating Badge (Top Right) */}
                        {game.user_review?.rating_overall ? (
                          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-lg border border-amber-500/30 bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-md shadow">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span>{game.user_review.rating_overall.toFixed(1)}</span>
                          </div>
                        ) : (
                          <div className="absolute top-2.5 right-2.5 z-10 rounded-lg border border-slate-700/60 bg-slate-950/70 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300 backdrop-blur-md">
                            Favorite
                          </div>
                        )}

                        {/* Quick Action Overlay on hover */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/80 p-3 opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100">
                          <Link
                            to={`/game/${game.id}`}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-indigo-500"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Detail Game</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => toggleFavoriteGame(game)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500 hover:text-white"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Lepas dari Slot</span>
                          </button>
                        </div>
                      </div>

                      {/* Card Info Footer */}
                      <div className="p-3 bg-slate-950/90">
                        <Link
                          to={`/game/${game.id}`}
                          className="line-clamp-1 text-xs font-extrabold text-white hover:text-amber-300 transition-colors"
                          title={game.name}
                        >
                          {game.name}
                        </Link>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{game.release_year ?? 'TBA'}</span>
                          <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[9px] font-medium text-slate-300">
                            Slot #{rankNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Empty Slot
                return (
                  <button
                    key={`empty-${slotIndex}`}
                    type="button"
                    onClick={handleOpenFavModal}
                    className="group relative flex aspect-[3/4] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/40 p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:bg-slate-900/40 hover:shadow-xl hover:shadow-amber-500/5 active:scale-95"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-500 transition-all duration-300 group-hover:scale-110 group-hover:border-amber-500/40 group-hover:bg-amber-500/10 group-hover:text-amber-400">
                      <Plus className="h-6 w-6" />
                    </div>
                    <span className="mt-3 text-xs font-bold text-slate-400 group-hover:text-amber-300 transition-colors">
                      + Isi Slot #{rankNumber}
                    </span>
                    <span className="mt-0.5 text-[10px] text-slate-500">
                      {slotIndex === 0 ? 'Top Pick Utama' : 'Pilih dari Library'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. LIBRARY SUMMARY & STATS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* DONUT CHART SUMMARY */}
            <section className="lg:col-span-2 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-md shadow-sm">
              <h2 className="text-xl font-bold text-white mb-6">Library Breakdown</h2>

              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* DONUT */}
                <div
                  className="relative flex h-48 w-48 shrink-0 items-center justify-center rounded-full p-2"
                  style={{ background: donutBackground }}
                >
                  <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border border-slate-800 bg-slate-950 shadow-inner">
                    <span className="text-3xl font-extrabold text-white">{total}</span>
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Total Game
                    </span>
                  </div>
                </div>

                {/* LEGEND STATS */}
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold text-slate-300">Completed</span>
                    </div>
                    <span className="text-sm font-extrabold text-white">{library.completed}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 rounded-full bg-indigo-500" />
                      <span className="text-xs font-semibold text-slate-300">Playing</span>
                    </div>
                    <span className="text-sm font-extrabold text-white">{library.playing}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 rounded-full bg-amber-500" />
                      <span className="text-xs font-semibold text-slate-300">Plan to Play</span>
                    </div>
                    <span className="text-sm font-extrabold text-white">{library.plan_to_play}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 rounded-full bg-rose-500" />
                      <span className="text-xs font-semibold text-slate-300">Dropped</span>
                    </div>
                    <span className="text-sm font-extrabold text-white">{library.dropped}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* AVERAGE RATING BREAKDOWN */}
            <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-md shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Rata-rata Rating</h2>
                <p className="text-xs text-slate-400 mb-6">
                  Statistik skor rata-rata yang pernah kamu berikan di setiap review.
                </p>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-semibold">Gameplay</span>
                      <span className="font-bold text-indigo-400">
                        {profile.stats.avg_ratings?.gameplay || '0.0'}/10
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${((profile.stats.avg_ratings?.gameplay || 0) / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-semibold">Story</span>
                      <span className="font-bold text-purple-400">
                        {profile.stats.avg_ratings?.story || '0.0'}/10
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${((profile.stats.avg_ratings?.story || 0) / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-semibold">Visual</span>
                      <span className="font-bold text-indigo-400">
                        {profile.stats.avg_ratings?.visual || '0.0'}/10
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${((profile.stats.avg_ratings?.visual || 0) / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Skor Keseluruhan</p>
                  <p className="text-xl font-extrabold text-amber-400">
                    ★ {profile.stats.avg_ratings?.overall || '0.0'}
                    <span className="text-xs text-slate-500 font-normal"> / 10</span>
                  </p>
                </div>
                <Link
                  to="/library"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <span>Buka Library</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ================= TAB 2: ACTIVITY & FRIENDS ================= */}
      {activeTab === 'activity' && (
        <div className="space-y-8">
          {/* RECENT ACTIVITY SECTION */}
          <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-md shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Aktivitas Terkini</h2>
                <p className="text-xs text-slate-400 mt-0.5">Pembaruan status game terakhir di library kamu.</p>
              </div>
              <span className="text-xs font-medium text-slate-500">4 aktivitas terbaru</span>
            </div>

            {profile.recent_activity.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Gamepad2 className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p className="text-sm">Belum ada aktivitas Library.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {profile.recent_activity.map((game) => {
                  const status = (game.pivot?.status ?? 'plan_to_play') as keyof typeof statusLabel;
                  return (
                    <div
                      key={game.id}
                      className="flex items-center gap-4 rounded-2xl border border-slate-800/60 bg-slate-950/40 p-3 transition-colors hover:border-slate-700 hover:bg-slate-950/80"
                    >
                      {/* COVER */}
                      <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-800 ring-1 ring-white/10">
                        {game.cover_url ? (
                          <img src={game.cover_url} alt={game.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                            No Cover
                          </div>
                        )}
                      </div>

                      {/* INFO */}
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/game/${game.id}`}
                          className="truncate font-bold text-sm text-white hover:text-indigo-400 transition-colors block"
                        >
                          {game.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {game.release_year ?? 'TBA'} • Diperbarui di koleksi
                        </p>
                      </div>

                      {/* STATUS BADGE */}
                      <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold whitespace-nowrap ${statusBadge[status]}`}>
                        {statusLabel[status]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* SOCIAL STATS / FOLLOWERS SUMMARY */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 backdrop-blur-md shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-base">Pengikut ({followers.length})</h3>
                <button
                  type="button"
                  onClick={() => setSocialModalType('followers')}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  Lihat Semua
                </button>
              </div>

              {followers.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Belum ada pengikut.</p>
              ) : (
                <div className="space-y-2">
                  {followers.slice(0, 3).map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleOpenProfile(u.id)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden border border-indigo-500/20">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                        ) : (
                          u.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-200 truncate flex-1">{u.name}</span>
                      <ExternalLink className="h-3 w-3 text-slate-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 backdrop-blur-md shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-base">Mengikuti ({following.length})</h3>
                <button
                  type="button"
                  onClick={() => setSocialModalType('following')}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  Lihat Semua
                </button>
              </div>

              {following.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Belum mengikuti siapa pun.</p>
              ) : (
                <div className="space-y-2">
                  {following.slice(0, 3).map((u) => (
                    <div
                      key={u.id}
                      onClick={() => handleOpenProfile(u.id)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden border border-purple-500/20">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                        ) : (
                          u.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-200 truncate flex-1">{u.name}</span>
                      <ExternalLink className="h-3 w-3 text-slate-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ================= TAB 3: ACCOUNT SETTINGS ================= */}
      {activeTab === 'settings' && (
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-md shadow-sm max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Pengaturan Profil</h2>
            <p className="text-xs text-slate-400 mt-1">
              Perbarui foto avatar, nama akun, dan email terdaftar kamu.
            </p>
          </div>

          {message && (
            <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400 shadow-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-400 shadow-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* AVATAR FILE UPLOAD */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Foto Profil / Avatar
              </label>

              <div className="flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shrink-0">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  ) : avatar ? (
                    <img
                      src={getStorageUrl(avatar) || undefined}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-slate-400">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <label className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:border-indigo-400 hover:text-white hover:bg-slate-800">
                  <span>Pilih Foto Baru</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* NAME */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 p-3 text-sm text-slate-100 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Email Akun
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700/80 bg-slate-800/60 p-3 text-sm text-slate-100 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                * Jika email diubah, kode OTP baru akan dikirimkan untuk verifikasi.
              </p>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition-all duration-150 hover:scale-[1.01] hover:bg-indigo-500 active:scale-95 disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan Perubahan...</span>
                  </>
                ) : (
                  <span>Simpan Perubahan Profil</span>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ================= SOCIAL MODAL (FOLLOWERS / FOLLOWING) ================= */}
      {socialModalType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSocialModalType(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {socialModalType === 'followers' ? 'Pengikut (Followers)' : 'Mengikuti (Following)'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daftar pengguna CritiPlay
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSocialModalType(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {isSocialLoading ? (
                <div className="py-8 text-center text-slate-400">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-500 mb-2" />
                  <span className="text-xs">Memuat daftar pengguna...</span>
                </div>
              ) : (socialModalType === 'followers' ? followers : following).length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">
                  {socialModalType === 'followers' ? 'Belum ada pengikut.' : 'Belum mengikuti siapa pun.'}
                </p>
              ) : (
                (socialModalType === 'followers' ? followers : following).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSocialModalType(null);
                      handleOpenProfile(item.id);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-950/40 p-2.5 text-left transition-colors hover:border-slate-700 hover:bg-slate-800/60"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-sm font-bold">
                      {item.avatar ? (
                        <img src={item.avatar} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        item.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-white">{item.name}</p>
                      <p className="text-[10px] text-slate-400">Lihat profil pengguna</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= FAVORITE GAMES SELECTION MODAL ================= */}
      {isFavModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto"
          onClick={() => setIsFavModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-amber-500/30 bg-slate-900/95 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">Kelola Hall of Fame</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pilih hingga 4 game terbaik dari library kamu ({favoriteGames.length}/4 Terisi)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFavModalOpen(false)}
                className="rounded-xl border border-slate-800 bg-slate-950 p-1.5 text-slate-400 hover:border-slate-700 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Live 4-Slot Preview Strip */}
            <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5">
              <div className="mb-2.5 flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Pratinjau Rak Showcase
                </span>
                <span>{favoriteGames.length} dari 4 slot aktif</span>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {[0, 1, 2, 3].map((slotIdx) => {
                  const g = favoriteGames[slotIdx];
                  const rank = slotIdx + 1;
                  if (g) {
                    return (
                      <div
                        key={g.id}
                        className="group relative flex flex-col overflow-hidden rounded-xl border border-amber-500/40 bg-slate-900 shadow-md"
                      >
                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950">
                          {g.cover_url ? (
                            <img src={g.cover_url} alt={g.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[9px] text-slate-500">
                              No Cover
                            </div>
                          )}
                          <div className="absolute top-1 left-1 rounded bg-black/80 px-1 py-0.2 text-[8px] font-black text-amber-400">
                            #{rank}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleFavoriteGame(g)}
                            className="absolute top-1 right-1 rounded-full bg-rose-600/90 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-500"
                            title="Lepas dari showcase"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                        <p className="truncate p-1.5 text-[10px] font-bold text-white text-center">
                          {g.name}
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={`preview-empty-${slotIdx}`}
                      className="flex aspect-[3/4] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center p-2"
                    >
                      <span className="text-[10px] font-bold text-slate-500">Slot #{rank}</span>
                      <span className="text-[9px] text-slate-600">Kosong</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Search filter inside modal */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari game dari library kamu..."
                value={favSearchQuery}
                onChange={(e) => setFavSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none"
              />
              {favSearchQuery && (
                <button
                  type="button"
                  onClick={() => setFavSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Library list */}
            {isLibraryLoading ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-400 mb-2" />
                <span className="text-xs">Memuat daftar game dari Library...</span>
              </div>
            ) : allLibraryGames.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <p className="text-sm">Library kamu masih kosong.</p>
                <Link to="/" className="text-xs text-amber-400 hover:underline mt-2 inline-block">
                  Jelajahi game dan tambahkan ke koleksi
                </Link>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {allLibraryGames
                  .filter((g) => g.name.toLowerCase().includes(favSearchQuery.toLowerCase()))
                  .map((game) => {
                    const isFav = favoriteGames.some((g) => g.id === game.id);
                    const favIndex = favoriteGames.findIndex((g) => g.id === game.id);
                    return (
                      <div
                        key={game.id}
                        onClick={() => toggleFavoriteGame(game)}
                        className={`flex items-center gap-3 rounded-xl border p-2.5 cursor-pointer transition-all ${
                          isFav
                            ? 'border-amber-500/60 bg-amber-500/10 text-white ring-1 ring-amber-500/20'
                            : 'border-slate-800/80 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-800 shadow">
                          {game.cover_url ? (
                            <img src={game.cover_url} alt={game.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[8px] text-slate-500">
                              No Cover
                            </div>
                          )}
                          {isFav && (
                            <div className="absolute top-0.5 left-0.5 rounded bg-amber-400 px-1 py-0.2 text-[8px] font-black text-slate-950">
                              #{favIndex + 1}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-white">{game.name}</p>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{game.release_year ?? 'TBA'}</span>
                            {game.user_review?.rating_overall && (
                              <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                                <Star className="h-2.5 w-2.5 fill-amber-400" />
                                {game.user_review.rating_overall.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                            isFav
                              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                              : 'border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600'
                          }`}
                        >
                          {isFav ? (
                            <>
                              <Check className="h-3 w-3 stroke-[3]" />
                              <span>Slot #{favIndex + 1}</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" />
                              <span>Pilih</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Modal Footer */}
            <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-4">
              <span className="text-xs text-slate-400">
                Maksimal 4 game favorit yang bisa disematkan.
              </span>
              <button
                type="button"
                onClick={() => setIsFavModalOpen(false)}
                className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-2 text-xs font-extrabold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 transition-all active:scale-95"
              >
                Simpan & Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}