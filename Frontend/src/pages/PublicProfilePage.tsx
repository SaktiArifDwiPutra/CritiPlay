import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Gamepad2,
  Trophy,
  Sparkles,
  Activity,
  UserPlus,
  UserCheck,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';

import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { getStorageUrl } from '../config/api';

import type { PublicProfile, SearchUser, ShowcaseGame } from '../types';

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

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Social Modal (Followers / Following)
  const [socialModalType, setSocialModalType] = useState<'followers' | 'following' | null>(null);
  const [userList, setUserList] = useState<SearchUser[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // Showcase games come directly from the API profile response
  const showcaseGames: ShowcaseGame[] = profile?.showcase_games ?? [];

  /*
   * ============================
   * LOAD PROFILE
   * ============================
   */
  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!userId) {
        setError('Profile tidak ditemukan.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');

        const [data, currentProfile] = await Promise.all([
          userService.getPublicProfile(userId),
          authService.getProfile(),
        ]);

        if (!isMounted) return;

        setProfile(data);
        setCurrentUserId(Number(currentProfile.user.id));
        setIsFollowing(Boolean(data.stats.is_following));
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
  }, [userId]);

  /*
   * ============================
   * FOLLOW / UNFOLLOW
   * ============================
   */
  const handleToggleFollow = async () => {
    if (!profile || followLoading) return;

    try {
      setFollowLoading(true);
      const targetUserId = String(profile.user.id);

      if (isFollowing) {
        await userService.unfollowUser(targetUserId);
        setIsFollowing(false);
        setProfile((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            stats: {
              ...prev.stats,
              followers_count: Math.max(0, (prev.stats.followers_count ?? 0) - 1),
            },
          };
        });
      } else {
        await userService.followUser(targetUserId);
        setIsFollowing(true);
        setProfile((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            stats: {
              ...prev.stats,
              followers_count: (prev.stats.followers_count ?? 0) + 1,
            },
          };
        });
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Gagal mengubah status follow.');
    } finally {
      setFollowLoading(false);
    }
  };

  /*
   * ============================
   * OPEN FOLLOWERS / FOLLOWING
   * ============================
   */
  const handleOpenSocialModal = async (type: 'followers' | 'following') => {
    if (!profile) return;

    try {
      setSocialModalType(type);
      setListLoading(true);

      const targetUserId = String(profile.user.id);
      const users =
        type === 'followers'
          ? await userService.getFollowers(targetUserId)
          : await userService.getFollowing(targetUserId);

      setUserList(users);
    } catch (err) {
      console.error(err);
      setUserList([]);
    } finally {
      setListLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl py-16 text-center">
        <div className="animate-pulse space-y-6">
          <div className="h-44 w-full rounded-3xl border border-slate-800 bg-slate-900/60" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 rounded-3xl border border-slate-800 bg-slate-900/60 md:col-span-2" />
            <div className="h-64 rounded-3xl border border-slate-800 bg-slate-900/60" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-10 backdrop-blur-md shadow-2xl">
          <Gamepad2 className="mx-auto h-16 w-16 text-slate-600 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Profil Tidak Ditemukan</h2>
          <p className="text-sm text-slate-400 mb-6">
            {error || 'Pengguna yang kamu cari tidak tersedia atau belum terdaftar.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </button>
        </div>
      </div>
    );
  }

  const { user, stats, recent_activity } = profile;
  const isOwnProfile = currentUserId === Number(user.id);
  const library = stats.library;
  const total = library.total_games;

  // Gamer Rank & Score calculation (same algorithm as ProfilePage)
  const gamerScore = library.completed * 15 + stats.total_reviews * 20 + library.playing * 5;
  const gamerLevel = Math.max(1, Math.floor(gamerScore / 40) + 1);

  let rankTitle = 'Casual Explorer';
  let rankGradient = 'from-indigo-400 to-purple-400';
  if (gamerLevel >= 10) {
    rankTitle = 'Mythic Completionist';
    rankGradient = 'from-purple-400 via-pink-400 to-amber-300';
  } else if (gamerLevel >= 6) {
    rankTitle = 'Hardcore Critic';
    rankGradient = 'from-indigo-400 via-purple-400 to-violet-300';
  } else if (gamerLevel >= 3) {
    rankTitle = 'Active Backlogger';
    rankGradient = 'from-blue-400 to-indigo-400';
  }

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
    <div className="mx-auto max-w-6xl pb-16 space-y-8">
      {/* ================= BACK BUTTON ================= */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group flex w-fit items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-300 shadow-sm transition-all duration-150 hover:scale-105 hover:border-slate-700 hover:text-white active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 text-indigo-400" />
          <span>Kembali</span>
        </button>

        {isOwnProfile && (
          <Link
            to="/profile"
            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20 transition-all"
          >
            <span>Edit Profil Saya &rarr;</span>
          </Link>
        )}
      </div>

      {/* ================= HERO PROFILE HEADER ================= */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 sm:p-8 shadow-xl backdrop-blur-md">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* AVATAR WITH BADGE */}
            <div className="relative group shrink-0">
              <div className="h-24 w-24 rounded-2xl bg-slate-800 p-0.5 ring-2 ring-indigo-500/30 overflow-hidden shadow-lg shadow-indigo-950/40">
                {user.avatar ? (
                  <img
                    src={getStorageUrl(user.avatar) || user.avatar}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-indigo-700 to-purple-700 text-3xl font-extrabold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* USER INFO & BADGE */}
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {user.name}
                </h1>

                {/* Gamer Rank / Badge */}
                <div className="flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-xs font-bold text-purple-300 shadow-sm">
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  <span className={`bg-gradient-to-r ${rankGradient} bg-clip-text text-transparent`}>
                    Lvl {gamerLevel} • {rankTitle}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  Bergabung sejak {user.joined_at}
                </span>
              </div>

              {/* FOLLOWER / FOLLOWING BUTTONS */}
              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleOpenSocialModal('followers')}
                  className="group flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-1.5 text-xs transition-all hover:border-slate-700 hover:bg-slate-800 active:scale-95"
                >
                  <span className="font-extrabold text-white group-hover:text-indigo-400 transition-colors">
                    {stats.followers_count ?? 0}
                  </span>
                  <span className="text-slate-400">Followers</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenSocialModal('following')}
                  className="group flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-1.5 text-xs transition-all hover:border-slate-700 hover:bg-slate-800 active:scale-95"
                >
                  <span className="font-extrabold text-white group-hover:text-indigo-400 transition-colors">
                    {stats.following_count ?? 0}
                  </span>
                  <span className="text-slate-400">Following</span>
                </button>
              </div>
            </div>
          </div>

          {/* ACTION / STATS SECTION */}
          <div className="flex flex-wrap items-center md:flex-col md:items-end gap-3">
            {/* Quick Stats Cards */}
            <div className="flex gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 text-center min-w-[100px]">
                <p className="text-2xl font-extrabold text-indigo-400">{library.total_games}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-400">Koleksi Game</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 text-center min-w-[100px]">
                <p className="text-2xl font-extrabold text-purple-400">{stats.total_reviews}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-400">Ulasan Dibuat</p>
              </div>
            </div>

            {/* FOLLOW / UNFOLLOW BUTTON */}
            {!isOwnProfile && (
              <button
                type="button"
                onClick={handleToggleFollow}
                disabled={followLoading}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 px-5 text-xs font-bold transition-all shadow-md active:scale-95 ${
                  isFollowing
                    ? 'border border-slate-700 bg-slate-800 text-slate-300 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {followLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : isFollowing ? (
                  <>
                    <UserCheck className="h-4 w-4 text-emerald-400" />
                    <span>Mengikuti (Following)</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>+ Ikuti Profil</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ================= FAVORITE GAMES SHOWCASE ================= */}
      <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-md shadow-xl">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <h2 className="text-xl font-bold text-white">Showcase Game Favorit</h2>
          {showcaseGames.length > 0 && (
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
              {showcaseGames.length}/4 Disematkan
            </span>
          )}
        </div>

        {showcaseGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center">
            <Gamepad2 className="h-8 w-8 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-400">Belum ada game favorit yang disematkan</p>
            <p className="mt-1 text-xs text-slate-500">
              Pengguna ini belum memilih game untuk ditampilkan di showcase profilnya.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {showcaseGames.map((game) => (
              <div
                key={game.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 transition-all hover:-translate-y-1 hover:border-slate-700 shadow-md"
              >
                <Link to={`/game/${game.id}`} className="relative block aspect-[3/4] w-full overflow-hidden">
                  {game.cover_url ? (
                    <img
                      src={game.cover_url}
                      alt={game.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-600">
                      <Gamepad2 className="h-6 w-6" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                </Link>
                <div className="p-3">
                  <Link
                    to={`/game/${game.id}`}
                    className="line-clamp-1 text-xs font-bold text-white hover:text-indigo-400 transition-colors"
                  >
                    {game.name}
                  </Link>
                  <p className="text-[10px] text-slate-400 mt-0.5">{game.release_year ?? 'TBA'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= LIBRARY SUMMARY & REVIEWS ================= */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DONUT CHART LIBRARY SUMMARY */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-bold text-white">Ringkasan Library</h2>
            <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
              {total} Total Game
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* Donut Chart */}
            <div
              className="relative flex h-48 w-48 shrink-0 items-center justify-center rounded-full shadow-lg"
              style={{ background: donutBackground }}
            >
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-slate-900 border border-slate-800/80 shadow-inner">
                <span className="text-3xl font-black text-white">{total}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total Game
                </span>
              </div>
            </div>

            {/* Legend Stats */}
            <div className="w-full flex-1 space-y-3.5">
              {/* Completed */}
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm" />
                  <span className="font-semibold text-slate-200">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{library.completed}</span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({completedPercent.toFixed(0)}%)
                  </span>
                </div>
              </div>

              {/* Playing */}
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-indigo-500 shadow-sm" />
                  <span className="font-semibold text-slate-200">Playing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{library.playing}</span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({playingPercent.toFixed(0)}%)
                  </span>
                </div>
              </div>

              {/* Plan to Play */}
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-amber-500 shadow-sm" />
                  <span className="font-semibold text-slate-200">Plan to Play</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{library.plan_to_play}</span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({planPercent.toFixed(0)}%)
                  </span>
                </div>
              </div>

              {/* Dropped */}
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-rose-500 shadow-sm" />
                  <span className="font-semibold text-slate-200">Dropped</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{library.dropped}</span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({droppedPercent.toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEW STATS */}
        <div className="flex flex-col justify-between rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-md shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Statistik Ulasan</h2>
            </div>
            <p className="text-xs text-slate-400">Total ulasan dan kontribusi komunitas</p>
          </div>

          <div className="my-6 text-center">
            <p className="text-5xl font-black text-purple-400">{stats.total_reviews}</p>
            <p className="mt-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Ulasan Diterbitkan
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3.5 text-center">
            <p className="text-[11px] text-slate-400">Tingkat Penyelesaian (Completion Rate)</p>
            <p className="text-base font-bold text-emerald-400 mt-0.5">
              {completedPercent.toFixed(1)}% dari total koleksi
            </p>
          </div>
        </div>
      </section>

      {/* ================= RECENT ACTIVITY ================= */}
      <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Aktivitas Terakhir</h2>
          </div>
          <span className="text-xs text-slate-400">5 pembaruan koleksi terakhir</span>
        </div>

        {recent_activity.length === 0 ? (
          <div className="py-12 text-center text-slate-500 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40">
            <Gamepad2 className="mx-auto h-8 w-8 text-slate-600 mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-400">Belum ada aktivitas di Library</p>
            <p className="text-xs text-slate-500 mt-0.5">Pengguna ini belum menambahkan game ke koleksinya.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recent_activity.map((game) => {
              const status = game.pivot?.status ?? 'plan_to_play';

              return (
                <div
                  key={game.id}
                  className="flex items-center gap-4 rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3 hover:border-slate-700/80 hover:bg-slate-800/40 transition-all"
                >
                  <Link
                    to={`/game/${game.id}`}
                    className="h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-900 ring-1 ring-white/10"
                  >
                    {game.cover_url ? (
                      <img
                        src={game.cover_url}
                        alt={game.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] text-slate-600">
                        No Cover
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/game/${game.id}`}
                      className="block text-sm font-bold text-white truncate hover:text-indigo-400 transition-colors"
                    >
                      {game.name}
                    </Link>

                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span>{game.release_year ?? 'TBA'}</span>
                      {game.platforms && game.platforms.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="truncate">{game.platforms.slice(0, 2).join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <span
                    className={`rounded-lg border px-3 py-1 text-xs font-bold whitespace-nowrap ${
                      statusBadge[status] || statusBadge.plan_to_play
                    }`}
                  >
                    {statusLabel[status] || 'Plan to Play'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= SOCIAL USERS MODAL ================= */}
      {socialModalType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSocialModalType(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  {socialModalType === 'followers' ? 'Pengikut (Followers)' : 'Mengikuti (Following)'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Daftar pengguna CritiPlay</p>
              </div>
              <button
                type="button"
                onClick={() => setSocialModalType(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {listLoading ? (
                <div className="py-8 text-center text-slate-400">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-500 mb-2" />
                  <span className="text-xs">Memuat daftar pengguna...</span>
                </div>
              ) : userList.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-500">
                  {socialModalType === 'followers'
                    ? 'Belum ada pengikut.'
                    : 'Belum mengikuti siapa pun.'}
                </p>
              ) : (
                userList.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSocialModalType(null);
                      navigate(`/profile/${item.id}`);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-950/40 p-2.5 text-left transition-colors hover:border-slate-700 hover:bg-slate-800/60"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/30">
                      {item.avatar ? (
                        <img
                          src={getStorageUrl(item.avatar) || item.avatar}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
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
    </div>
  );
}