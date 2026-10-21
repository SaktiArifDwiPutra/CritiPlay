import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Gamepad2,
  Trophy,
  BarChart3,
  User,
  Users,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  Star,
  ChevronRight,
  Monitor,
} from 'lucide-react';
import { statisticsService, type StatisticsData, type AspectLeader } from '../services/statisticsService';

type TabView = 'personal' | 'community';

export default function Statistics() {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [activeTab, setActiveTab] = useState<TabView>('personal');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        const result = await statisticsService.getStatistics();
        setData(result);
      } catch (err) {
        console.error('Gagal mengambil statistik:', err);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-8 animate-pulse">
        <div className="h-10 w-48 rounded-lg bg-slate-800" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-900 ring-1 ring-white/10" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-80 rounded-2xl bg-slate-900 ring-1 ring-white/10" />
          <div className="h-80 rounded-2xl bg-slate-900 ring-1 ring-white/10" />
        </div>
      </div>
    );
  }

  if (hasError || !data) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
          <XCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Gagal Memuat Statistik</h2>
        <p className="mt-2 text-sm text-slate-400">
          Terjadi kendala saat menghitung data statistik analitik. Silakan coba beberapa saat lagi.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/30 transition-colors hover:bg-indigo-500"
        >
          Muat Ulang Halaman
        </button>
      </div>
    );
  }

  const { personal, community } = data;
  const lib = personal.library;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Pusat Statistik
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-slate-400">
            Wawasan mendalam seputar perjalanan bermain game kamu dan tren komunitas CritiPlay.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-900 p-1 ring-1 ring-white/10" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'personal'}
            onClick={() => setActiveTab('personal')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'personal'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Statistik Saya</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'community'}
            onClick={() => setActiveTab('community')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'community'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Komunitas</span>
          </button>
        </div>
      </div>
      {activeTab === 'personal' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total di Library
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Gamepad2 className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{lib.total}</span>
                <span className="text-xs text-slate-400">game</span>
              </div>
              <p className="mt-1 text-xs text-indigo-300 font-medium">
                {lib.completion_rate}% telah ditamatkan
              </p>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tamat Bermain
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{lib.completed}</span>
                <span className="text-xs text-slate-400">selesai</span>
              </div>
              <p className="mt-1 text-xs text-emerald-400 font-medium">
                {lib.playing} game sedang dimainkan
              </p>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Review Ditulis
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Star className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{personal.reviews.count}</span>
                <span className="text-xs text-slate-400">ulasan</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <ThumbsUp className="h-3 w-3 text-indigo-400" />
                <span>{personal.reviews.helpful_votes_received} suara terbantu</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Skor Rata-rata Kamu
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                  <Trophy className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {personal.reviews.averages.overall > 0 ? personal.reviews.averages.overall.toFixed(1) : '-'}
                </span>
                <span className="text-xs text-slate-400">/ 10</span>
              </div>
              <p className="mt-1 text-xs text-purple-300 font-medium">
                Overall rating personal
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Komposisi Koleksi Game
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Distribusi status permainan di library kamu.
            </p>
            <div className="mt-5 flex h-3.5 w-full overflow-hidden rounded-full bg-slate-800">
              {lib.total > 0 ? (
                <>
                  <div
                    style={{ width: `${(lib.completed / lib.total) * 100}%` }}
                    className="bg-emerald-500 transition-all duration-500"
                    title={`Completed: ${lib.completed}`}
                  />
                  <div
                    style={{ width: `${(lib.playing / lib.total) * 100}%` }}
                    className="bg-indigo-500 transition-all duration-500"
                    title={`Playing: ${lib.playing}`}
                  />
                  <div
                    style={{ width: `${(lib.plan_to_play / lib.total) * 100}%` }}
                    className="bg-amber-500 transition-all duration-500"
                    title={`Plan to Play: ${lib.plan_to_play}`}
                  />
                  <div
                    style={{ width: `${(lib.dropped / lib.total) * 100}%` }}
                    className="bg-rose-500 transition-all duration-500"
                    title={`Dropped: ${lib.dropped}`}
                  />
                </>
              ) : (
                <div className="w-full bg-slate-800" />
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="flex items-center gap-2 rounded-xl bg-slate-950/60 p-3 ring-1 ring-white/5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Tamat (Completed)</p>
                  <p className="text-sm font-bold text-slate-200">{lib.completed} game</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-950/60 p-3 ring-1 ring-white/5">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Sedang Dimainkan</p>
                  <p className="text-sm font-bold text-slate-200">{lib.playing} game</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-950/60 p-3 ring-1 ring-white/5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Plan to Play</p>
                  <p className="text-sm font-bold text-slate-200">{lib.plan_to_play} game</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-950/60 p-3 ring-1 ring-white/5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Dropped</p>
                  <p className="text-sm font-bold text-slate-200">{lib.dropped} game</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Kecenderungan Rating Aspek Kamu
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Nilai rata-rata tiap pilar ulasan yang kamu berikan kepada game.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-indigo-300">Gameplay & Mekanik</span>
                    <span className="text-slate-200">
                      {personal.reviews.averages.gameplay > 0 ? personal.reviews.averages.gameplay.toFixed(1) : '-'} / 10
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800">
                    <div
                      style={{ width: `${(personal.reviews.averages.gameplay / 10) * 100}%` }}
                      className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-purple-300">Story & Narasi</span>
                    <span className="text-slate-200">
                      {personal.reviews.averages.story > 0 ? personal.reviews.averages.story.toFixed(1) : '-'} / 10
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800">
                    <div
                      style={{ width: `${(personal.reviews.averages.story / 10) * 100}%` }}
                      className="h-2 rounded-full bg-purple-500 transition-all duration-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-cyan-300">Visual & Grafis</span>
                    <span className="text-slate-200">
                      {personal.reviews.averages.visual > 0 ? personal.reviews.averages.visual.toFixed(1) : '-'} / 10
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800">
                    <div
                      style={{ width: `${(personal.reviews.averages.visual / 10) * 100}%` }}
                      className="h-2 rounded-full bg-cyan-500 transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10 space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Genre Favorit di Library
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {personal.top_genres.length > 0 ? (
                    personal.top_genres.map((g) => (
                      <span
                        key={g.name}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-950/60 px-3 py-1.5 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/20"
                      >
                        <span>{g.name}</span>
                        <span className="rounded-full bg-indigo-800/80 px-1.5 py-0.2 text-[10px] text-white">
                          {g.count}
                        </span>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">Belum ada genre tercatat di koleksimu.</p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Platform Paling Banyak Dimainkan
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {personal.top_platforms.length > 0 ? (
                    personal.top_platforms.map((p) => (
                      <span
                        key={p.name}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 ring-1 ring-white/10"
                      >
                        <Monitor className="h-3.5 w-3.5 text-indigo-400" />
                        <span>{p.name}</span>
                        <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">
                          {p.count}
                        </span>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">Belum ada platform tercatat.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {personal.highest_rated_games.length > 0 && (
            <div className="rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Game Rating Tertinggi Pilihan Kamu
                </h3>
                <Link
                  to="/library"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  <span>Buka Library</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {personal.highest_rated_games.map((game) => (
                  <Link
                    key={game.id}
                    to={`/game/${game.id}`}
                    className="group flex gap-3 rounded-xl bg-slate-950/70 p-3 ring-1 ring-white/5 transition-all hover:ring-indigo-500/30 hover:bg-slate-950"
                  >
                    {game.cover_url ? (
                      <img
                        src={game.cover_url}
                        alt=""
                        className="aspect-[2/3] w-14 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="aspect-[2/3] w-14 shrink-0 rounded-lg bg-slate-800" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                        {game.name}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-extrabold text-amber-400 ring-1 ring-amber-500/30">
                          ★ {game.rating_overall.toFixed(1)}
                        </span>
                        <span className="text-[11px] text-slate-500">Overall</span>
                      </div>
                      <div className="mt-2 text-[10px] text-slate-400 flex gap-2">
                        <span>GP: {game.rating_gameplay.toFixed(1)}</span>
                        <span>ST: {game.rating_story.toFixed(1)}</span>
                        <span>VI: {game.rating_visual.toFixed(1)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'community' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Game Diulas
              </span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {community.overview.total_reviewed_games}
                </span>
                <span className="text-xs text-slate-400">game</span>
              </div>
              <p className="mt-1 text-xs text-emerald-400">
                Telah dinilai oleh komunitas
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Ulasan
              </span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {community.overview.total_reviews}
                </span>
                <span className="text-xs text-slate-400">ulasan</span>
              </div>
              <p className="mt-1 text-xs text-amber-400">
                Ulasan objektif multi-aspek
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pemain Aktif
              </span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {community.overview.total_active_players}
                </span>
                <span className="text-xs text-slate-400">gamer</span>
              </div>
              <p className="mt-1 text-xs text-purple-400">
                Sedang & telah menamatkan game
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Jawara Rating per Aspek Komunitas
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Game dengan perolehan skor tertinggi di masing-masing kategori penilaian.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <LeaderCard
                title="Juara Umum (Overall)"
                aspect="Overall"
                badgeColor="border-amber-500/50 bg-amber-500/10 text-amber-300"
                leader={community.aspect_leaders.overall}
              />
              <LeaderCard
                title="Gameplay Terbaik"
                aspect="Gameplay"
                badgeColor="border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                leader={community.aspect_leaders.gameplay}
              />
              <LeaderCard
                title="Story Paling Memikat"
                aspect="Story"
                badgeColor="border-purple-500/50 bg-purple-500/10 text-purple-300"
                leader={community.aspect_leaders.story}
              />
              <LeaderCard
                title="Visual & Grafis Terindah"
                aspect="Visual"
                badgeColor="border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                leader={community.aspect_leaders.visual}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Rata-rata Skor Aspek Komunitas
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Keseimbangan penilaian komunitas di seluruh ulasan.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-indigo-300">Gameplay</span>
                    <span className="text-slate-200">{community.aspect_averages.gameplay.toFixed(1)} / 10</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800">
                    <div
                      style={{ width: `${(community.aspect_averages.gameplay / 10) * 100}%` }}
                      className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-purple-300">Story</span>
                    <span className="text-slate-200">{community.aspect_averages.story.toFixed(1)} / 10</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800">
                    <div
                      style={{ width: `${(community.aspect_averages.story / 10) * 100}%` }}
                      className="h-2 rounded-full bg-purple-500 transition-all duration-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-cyan-300">Visual</span>
                    <span className="text-slate-200">{community.aspect_averages.visual.toFixed(1)} / 10</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800">
                    <div
                      style={{ width: `${(community.aspect_averages.visual / 10) * 100}%` }}
                      className="h-2 rounded-full bg-cyan-500 transition-all duration-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-amber-300">Overall Benchmark</span>
                    <span className="text-slate-200">{community.aspect_averages.overall.toFixed(1)} / 10</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800">
                    <div
                      style={{ width: `${(community.aspect_averages.overall / 10) * 100}%` }}
                      className="h-2 rounded-full bg-amber-500 transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Sebaran Rating Ulasan
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Distribusi skor kepuasan ulasan dari komunitas.
              </p>

              <div className="mt-6 space-y-3">
                {community.rating_distribution.map((dist) => {
                  const maxCount = Math.max(
                    ...community.rating_distribution.map((d) => d.count),
                    1
                  );
                  const pct = Math.round((dist.count / maxCount) * 100);

                  return (
                    <div key={dist.range} className="flex items-center gap-3 text-xs">
                      <span className="w-16 font-semibold text-slate-400">{dist.range}</span>
                      <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500"
                        />
                      </div>
                      <span className="w-10 text-right font-bold text-slate-300">
                        {dist.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {community.most_reviewed_games.length > 0 && (
            <div className="rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Game Paling Ramai Diulas Komunitas
                </h3>
                <Link
                  to="/"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  <span>Jelajahi Beranda</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {community.most_reviewed_games.map((game) => (
                  <Link
                    key={game.id}
                    to={`/game/${game.id}`}
                    className="group flex gap-3 rounded-xl bg-slate-950/70 p-3 ring-1 ring-white/5 transition-all hover:ring-indigo-500/30 hover:bg-slate-950"
                  >
                    {game.cover_url ? (
                      <img
                        src={game.cover_url}
                        alt=""
                        className="aspect-[2/3] w-14 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="aspect-[2/3] w-14 shrink-0 rounded-lg bg-slate-800" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                        {game.name}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-extrabold text-amber-400 ring-1 ring-amber-500/30">
                          ★ {game.avg_overall.toFixed(1)}
                        </span>
                        <span className="text-[11px] text-slate-500">Overall</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        {game.totalReviews} review
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LeaderCard({
  title,
  aspect,
  badgeColor,
  leader,
}: {
  title: string;
  aspect: string;
  badgeColor: string;
  leader: AspectLeader | null;
}) {
  if (!leader) {
    return (
      <div className="flex flex-col justify-center rounded-xl bg-slate-950/60 p-4 ring-1 ring-white/5 text-center">
        <p className="text-xs text-slate-400">{title}</p>
        <p className="mt-2 text-xs text-slate-400">Belum ada review</p>
      </div>
    );
  }

  return (
    <Link
      to={`/game/${leader.id}`}
      className="group relative flex flex-col rounded-xl bg-slate-950/60 p-4 ring-1 ring-white/5 transition-all hover:bg-slate-950 hover:ring-indigo-500/30"
    >
      <span className={`self-start rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}>
        {title}
      </span>
      <div className="mt-3 flex gap-3">
        {leader.cover_url ? (
          <img
            src={leader.cover_url}
            alt=""
            className="aspect-[2/3] w-12 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
          />
        ) : (
          <div className="aspect-[2/3] w-12 shrink-0 rounded-lg bg-slate-800" />
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
            {leader.name}
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-base font-black text-amber-400">
              {leader.score.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-500">/ 10 ({aspect})</span>
          </div>
          <p className="text-[10px] text-slate-400">{leader.totalReviews} ulasan</p>
        </div>
      </div>
    </Link>
  );
}