import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { authService } from '../services/authService';
import { userService } from '../services/userService';
import type { SearchUser } from '../types';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserSearchModal({
  isOpen,
  onClose
}: UserSearchModalProps) {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);

  const [followingIds, setFollowingIds] = useState<Set<string>>(
    new Set()
  );

  const [followLoading, setFollowLoading] = useState<Set<string>>(
    new Set()
  );

  // Load following user saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    const loadFollowing = async () => {
      try {
        const profile = await authService.getProfile();

        const following = await userService.getFollowing(
          String(profile.user.id)
        );

        setFollowingIds(
          new Set(following.map((user) => user.id))
        );
      } catch (error) {
        console.error('Gagal mengambil following:', error);
      }
    };

    loadFollowing();
  }, [isOpen]);

  // Search user
  useEffect(() => {
  if (!isOpen || !query.trim()) {
    return;
  }

  const timeout = setTimeout(async () => {
    try {
      setLoading(true);

      const results = await userService.searchUsers(
        query.trim()
      );

      setUsers(results);
    } catch (error) {
      console.error('Gagal mencari user:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, 400);

  return () => clearTimeout(timeout);
}, [query, isOpen]);

  const handleClose = () => {
    setQuery('');
    setUsers([]);
    setLoading(false);

    onClose();
  };

  const handleUserClick = (userId: string) => {
    handleClose();
    navigate(`/profile/${userId}`);
  };

  const handleToggleFollow = async (userId: string) => {
    if (followLoading.has(userId)) return;

    setFollowLoading((prev) => {
      const next = new Set(prev);
      next.add(userId);
      return next;
    });

    try {
      if (followingIds.has(userId)) {
        await userService.unfollowUser(userId);

        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      } else {
        await userService.followUser(userId);

        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.add(userId);
          return next;
        });
      }
    } catch (error) {
      console.error('Gagal mengubah follow:', error);
    } finally {
      setFollowLoading((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  // PENTING:
  // Kalau modal tidak dibuka, jangan render apa pun.
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Add Friend
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Cari user untuk melihat profile mereka
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="p-6">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari username..."
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Results */}
          <div className="mt-4 max-h-80 overflow-y-auto">
            {!query.trim() ? (
              <p className="text-center text-sm text-slate-400 py-8">
                Ketik nama user untuk mencari.
              </p>
            ) : loading ? (
              <p className="text-center text-sm text-slate-400 py-8">
                Mencari user...
              </p>
            ) : users.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">
                User tidak ditemukan.
              </p>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    {/* User info */}
                    <button
                      type="button"
                      onClick={() => handleUserClick(user.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold overflow-hidden shrink-0">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>

                      {/* Name */}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">
                          {user.name}
                        </p>

                        <p className="text-xs text-slate-400">
                          Lihat profile
                        </p>
                      </div>
                    </button>

                    {/* Follow button */}
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(user.id)}
                      disabled={followLoading.has(user.id)}
                      className={`shrink-0 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                        followingIds.has(user.id)
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } disabled:opacity-60`}
                    >
                      {followLoading.has(user.id)
                        ? '...'
                        : followingIds.has(user.id)
                          ? 'Following'
                          : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}