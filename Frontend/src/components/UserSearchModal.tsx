import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  Loader2,
  Search,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

import { authService } from '../services/authService';
import { userService } from '../services/userService';
import type { SearchUser } from '../types';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserSearchModal({
  isOpen,
  onClose,
}: UserSearchModalProps) {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set());

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const loadFollowing = async () => {
      try {
        const profile = await authService.getProfile();
        setCurrentUserId(String(profile.user.id));
        const following = await userService.getFollowing(String(profile.user.id));
        setFollowingIds(new Set(following.map((u) => String(u.id))));
      } catch (error) {
        console.error('Gagal mengambil following:', error);
      }
    };
    loadFollowing();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setUsers([]);
      setLoading(false);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const results = await userService.searchUsers(query.trim());
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
    setFollowLoading((prev) => { const next = new Set(prev); next.add(userId); return next; });
    try {
      if (followingIds.has(userId)) {
        await userService.unfollowUser(userId);
        setFollowingIds((prev) => { const next = new Set(prev); next.delete(userId); return next; });
      } else {
        await userService.followUser(userId);
        setFollowingIds((prev) => { const next = new Set(prev); next.add(userId); return next; });
      }
    } catch (error) {
      console.error('Gagal mengubah follow:', error);
    } finally {
      setFollowLoading((prev) => { const next = new Set(prev); next.delete(userId); return next; });
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998] bg-black/75 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" aria-modal="true" role="dialog">
        <div ref={panelRef} className="relative w-full max-w-lg rounded-2xl border border-slate-800/80 bg-slate-900/95 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
          <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600/15 text-indigo-400 ring-1 ring-indigo-500/30">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white">Cari Pengguna</h2>
                <p className="mt-0.5 text-xs text-slate-400">Temukan gamer lain dan ikuti profil mereka</p>
              </div>
            </div>
            <button type="button" onClick={handleClose} aria-label="Tutup modal" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik nama atau username..."
                autoFocus
                className="h-11 w-full rounded-xl border border-slate-700/80 bg-slate-800/60 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Hapus teks pencarian" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-700/60 hover:text-slate-300">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 max-h-80 overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {!query.trim() ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/60 ring-1 ring-white/5">
                  <Users className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-200">Cari Teman Gaming</p>
                <p className="mt-1 max-w-xs text-xs text-slate-400">Ketik nama pengguna untuk melihat profil dan koleksi game mereka.</p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Loader2 className="mb-3 h-7 w-7 animate-spin text-indigo-400" />
                <p className="text-xs font-medium text-slate-400">Mencari pengguna...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/60 ring-1 ring-white/5">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-200">Pengguna Tidak Ditemukan</p>
                <p className="mt-1 max-w-xs text-xs text-slate-400">Tidak ada gamer dengan nama "{query}". Coba periksa kembali ejaan.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => {
                  const isSelf = currentUserId === String(user.id);
                  const isFollowing = followingIds.has(String(user.id));
                  const isButtonLoading = followLoading.has(String(user.id));
                  return (
                    <div key={user.id} className="group flex items-center justify-between gap-3 rounded-xl border border-slate-800/70 bg-slate-950/40 p-2.5 transition-colors hover:border-slate-700/80 hover:bg-slate-800/50 sm:p-3">
                      <button type="button" onClick={() => handleUserClick(String(user.id))} className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none">
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-600/20 text-sm font-bold text-indigo-400 ring-1 ring-indigo-500/30">
                          {user.avatar ? <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-100 transition-colors group-hover:text-indigo-300">{user.name}</p>
                          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">Lihat profil <ExternalLink className="h-3 w-3 opacity-60" /></span>
                        </div>
                      </button>
                      {isSelf ? (
                        <span className="shrink-0 rounded-lg border border-slate-800 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-400">Anda</span>
                      ) : (
                        <button type="button" onClick={() => handleToggleFollow(String(user.id))} disabled={isButtonLoading} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-60 ${isFollowing ? 'border border-slate-700/80 bg-slate-800 text-slate-300 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400' : 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95'}`}>
                          {isButtonLoading ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>...</span></>) : isFollowing ? (<><UserCheck className="h-3.5 w-3.5 text-emerald-400" /><span>Following</span></>) : (<><UserPlus className="h-3.5 w-3.5" /><span>Follow</span></>)}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
