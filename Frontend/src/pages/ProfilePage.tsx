import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { authService } from '../services/authService';
import { userService } from '../services/userService';

import type { SearchUser } from '../types';

type LibraryStats = {
  total_games: number;
  completed: number;
  playing: number;
  plan_to_play: number;
  dropped: number;
};

type ProfileData = {
  user: {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    joined_at: string;
  };
  stats: {
    library: LibraryStats;
    total_reviews: number;
  };
  recent_activity: RecentGame[];
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

const API_URL = 'http://127.0.0.1:8000/api/profile';

const getHeaders = () => ({
  Accept: 'application/json',
  Authorization: `Bearer ${authService.getToken()}`
});

const statusLabel = {
  completed: 'Completed',
  playing: 'Playing',
  plan_to_play: 'Plan to Play',
  dropped: 'Dropped',
};

const statusColor = {
  completed: 'bg-green-50 text-green-700',
  playing: 'bg-blue-50 text-blue-700',
  plan_to_play: 'bg-yellow-50 text-yellow-700',
  dropped: 'bg-red-50 text-red-700',
};

export default function ProfilePage() {
  const navigate = useNavigate();

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

  // ============================
  // FOLLOWERS / FOLLOWING
  // ============================

  const [followers, setFollowers] = useState<SearchUser[]>([]);
  const [following, setFollowing] = useState<SearchUser[]>([]);

  const [isFollowersOpen, setIsFollowersOpen] = useState(false);
  const [isFollowingOpen, setIsFollowingOpen] = useState(false);

  const [isSocialLoading, setIsSocialLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data: ProfileData = await authService.getProfile();

        console.log('PROFILE DATA:', data);
        console.log('TOTAL REVIEWS:', data.stats?.total_reviews);

        setProfile(data);
        setName(data.user.name);
        setEmail(data.user.email);
        setAvatar(data.user.avatar);

        // Load followers & following
        try {
          setIsSocialLoading(true);

          const [followersData, followingData] =
            await Promise.all([
              userService.getFollowers(String(data.user.id)),
              userService.getFollowing(String(data.user.id))
            ]);

          setFollowers(followersData);
          setFollowing(followingData);
        } catch (socialError) {
          console.error(
            'Gagal mengambil followers/following:',
            socialError
          );
        } finally {
          setIsSocialLoading(false);
        }

      } catch (err) {
        console.error(err);
        setError('Gagal mengambil data profile.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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

      // Refresh data profile setelah update
      const response = await fetch(API_URL, {
        headers: getHeaders()
      });

      if (response.ok) {
        const data: ProfileData = await response.json();

        setProfile(data);
        setName(data.user.name);
        setEmail(data.user.email);
        setAvatar(data.user.avatar);
      }
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
      <div className="max-w-6xl mx-auto py-16 text-center">
        <p className="text-slate-500 animate-pulse font-medium">
          Memuat profile...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center">
        <div className="bg-white rounded-2xl p-8 border border-slate-100">
          <p className="text-red-500 font-semibold">
            {error || 'Profile tidak ditemukan.'}
          </p>
        </div>
      </div>
    );
  }

  const library = profile.stats.library;

  const total = library.total_games;

  const completedPercent =
    total > 0 ? (library.completed / total) * 100 : 0;

  const playingPercent =
    total > 0 ? (library.playing / total) * 100 : 0;

  const planPercent =
    total > 0 ? (library.plan_to_play / total) * 100 : 0;

  const droppedPercent =
    total > 0 ? (library.dropped / total) * 100 : 0;

  const completedEnd = completedPercent;
  const playingEnd = completedEnd + playingPercent;
  const planEnd = playingEnd + planPercent;
  const droppedEnd = planEnd + droppedPercent;

  const donutBackground =
    total > 0
      ? `conic-gradient(
          #22c55e 0% ${completedEnd}%,
          #3b82f6 ${completedEnd}% ${playingEnd}%,
          #eab308 ${playingEnd}% ${planEnd}%,
          #ef4444 ${planEnd}% ${droppedEnd}%
        )`
      : '#e2e8f0';

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ================= PROFILE HEADER ================= */}

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

          <div className="flex items-center gap-5">

            {/* AVATAR */}

            <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden border-4 border-white shadow-md flex items-center justify-center">

              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : avatar ? (
                <img
                  src={
                    avatar.startsWith('http')
                      ? avatar
                      : `http://127.0.0.1:8000/storage/${avatar}`
                  }
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-slate-400">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}

            </div>

            {/* USER INFO */}

            <div>

              <h1 className="text-3xl font-extrabold text-slate-900">
                {profile.user.name}
              </h1>

              <p className="text-slate-500 mt-1">
                {profile.user.email}
              </p>

              <p className="text-sm text-slate-400 mt-2">
                Bergabung sejak {profile.user.joined_at}
              </p>

              {/* FOLLOWER / FOLLOWING COUNT */}

              <div className="flex items-center gap-5 mt-4">

                <button
                  type="button"
                  onClick={() => {
                    setIsFollowersOpen(!isFollowersOpen);
                    setIsFollowingOpen(false);
                  }}
                  className="text-left hover:text-blue-600 transition-colors"
                >
                  <span className="font-extrabold text-slate-800">
                    {followers.length}
                  </span>

                  <span className="ml-1 text-sm text-slate-500">
                    Followers
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsFollowingOpen(!isFollowingOpen);
                    setIsFollowersOpen(false);
                  }}
                  className="text-left hover:text-blue-600 transition-colors"
                >
                  <span className="font-extrabold text-slate-800">
                    {following.length}
                  </span>

                  <span className="ml-1 text-sm text-slate-500">
                    Following
                  </span>
                </button>

              </div>

            </div>

          </div>

          {/* TOTAL GAMES */}

          <div className="bg-blue-50 text-blue-700 rounded-2xl px-5 py-4 text-center">

            <p className="text-2xl font-extrabold">
              {library.total_games}
            </p>

            <p className="text-sm font-semibold">
              Games in Library
            </p>

          </div>

        </div>

      </section>


      {/* ================= FOLLOWERS / FOLLOWING ================= */}

      {(isFollowersOpen || isFollowingOpen) && (
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">

          <div className="flex items-center justify-between mb-6">

            <div>

              <h2 className="text-2xl font-bold text-slate-800">
                {isFollowersOpen
                  ? 'Followers'
                  : 'Following'}
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                {isFollowersOpen
                  ? 'Orang yang mengikuti kamu'
                  : 'Orang yang kamu ikuti'}
              </p>

            </div>

            <button
              type="button"
              onClick={() => {
                setIsFollowersOpen(false);
                setIsFollowingOpen(false);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold hover:bg-slate-200 transition-colors"
            >
              Tutup
            </button>

          </div>

          {isSocialLoading ? (

            <div className="py-10 text-center">
              <p className="text-slate-400 animate-pulse">
                Memuat...
              </p>
            </div>

          ) : (

            <div className="space-y-2">

              {(isFollowersOpen
                ? followers
                : following
              ).length === 0 ? (

                <div className="py-10 text-center">

                  <p className="text-slate-400">
                    {isFollowersOpen
                      ? 'Belum ada followers.'
                      : 'Belum mengikuti siapa pun.'}
                  </p>

                </div>

              ) : (

                (isFollowersOpen
                  ? followers
                  : following
                ).map((item) => (

                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleOpenProfile(item.id)}
                    className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors text-left"
                  >

                    {/* AVATAR */}

                    <div className="w-12 h-12 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center shrink-0">

                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-bold text-blue-600 text-lg">
                          {item.name
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}

                    </div>

                    {/* NAME */}

                    <div className="flex-1 min-w-0">

                      <p className="font-bold text-slate-800 truncate">
                        {item.name}
                      </p>

                      <p className="text-sm text-slate-400">
                        Lihat profile
                      </p>

                    </div>

                    {/* ARROW */}

                    <span className="text-slate-300 text-xl">
                      →
                    </span>

                  </button>

                ))

              )}

            </div>

          )}

        </section>
      )}


      {/* ================= LIBRARY + REVIEWS ================= */}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LIBRARY SUMMARY */}

        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">

          <h2 className="text-2xl font-bold text-slate-800 mb-8">
            Library Summary
          </h2>

          <div className="flex flex-col md:flex-row items-center gap-10">

            {/* DONUT */}

            <div
              className="w-52 h-52 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: donutBackground
              }}
            >

              <div className="w-32 h-32 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">

                <span className="text-3xl font-extrabold text-slate-800">
                  {total}
                </span>

                <span className="text-xs font-semibold text-slate-400">
                  TOTAL
                </span>

              </div>

            </div>

            {/* LEGEND */}

            <div className="w-full space-y-4">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-green-500" />

                  <span className="font-medium text-slate-600">
                    Completed
                  </span>
                </div>

                <span className="font-bold text-slate-800">
                  {library.completed}
                </span>

              </div>


              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />

                  <span className="font-medium text-slate-600">
                    Playing
                  </span>
                </div>

                <span className="font-bold text-slate-800">
                  {library.playing}
                </span>

              </div>


              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />

                  <span className="font-medium text-slate-600">
                    Plan to Play
                  </span>
                </div>

                <span className="font-bold text-slate-800">
                  {library.plan_to_play}
                </span>

              </div>


              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-red-500" />

                  <span className="font-medium text-slate-600">
                    Dropped
                  </span>
                </div>

                <span className="font-bold text-slate-800">
                  {library.dropped}
                </span>

              </div>

            </div>

          </div>

        </div>


        {/* REVIEW STATS */}

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">

          <h2 className="text-2xl font-bold text-slate-800 mb-8">
            Review Stats
          </h2>

          <div className="flex flex-col items-center justify-center h-52">

            <p className="text-4xl font-extrabold text-slate-800">
              {profile.stats.total_reviews}
            </p>

            <p className="text-slate-500 font-medium">
              Total Reviews
            </p>

          </div>

        </div>

      </section>


      {/* ================= RECENT ACTIVITY ================= */}

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">

        <div className="flex items-center justify-between mb-6">

          <h2 className="text-2xl font-bold text-slate-800">
            Recent Activity
          </h2>

          <span className="text-sm text-slate-400">
            Last 3 updates
          </span>

        </div>

        {profile.recent_activity.length === 0 ? (

          <div className="py-10 text-center text-slate-500">
            Belum ada aktivitas Library.
          </div>

        ) : (

          <div className="space-y-4">

            {profile.recent_activity.map((game) => {

              const status =
                game.pivot?.status ?? 'plan_to_play';

              return (
                <div
                  key={game.id}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors"
                >

                  {/* COVER */}

                  <div className="w-14 h-20 rounded-lg overflow-hidden bg-slate-100 shrink-0">

                    {game.cover_url ? (
                      <img
                        src={game.cover_url}
                        alt={game.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                        No Image
                      </div>
                    )}

                  </div>

                  {/* INFO */}

                  <div className="flex-1 min-w-0">

                    <h3 className="font-bold text-slate-800 truncate">
                      {game.name}
                    </h3>

                    <p className="text-sm text-slate-400 mt-1">
                      {game.release_year ?? 'Unknown'}
                    </p>

                  </div>

                  {/* STATUS */}

                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                      statusColor[status]
                    }`}
                  >
                    {statusLabel[status]}
                  </span>

                </div>
              );
            })}

          </div>

        )}

      </section>


      {/* ================= EDIT PROFILE ================= */}

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">

        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Pengaturan Profil
        </h2>

        {message && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-semibold mb-6">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* AVATAR */}

          <div>

            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Foto Profil
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />

          </div>


          {/* NAME */}

          <div>

            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Nama Lengkap
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:border-blue-500"
            />

          </div>


          {/* EMAIL */}

          <div>

            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:border-blue-500"
            />

          </div>


          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm disabled:opacity-70"
          >
            {isSaving
              ? 'Menyimpan...'
              : 'Simpan Perubahan'}
          </button>

        </form>

      </section>

    </div>
  );
}