import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Loader2,
  LogOut,
  UserPlus,
  Menu,
  X,
  Gamepad2,
  User,
  Shield,
} from 'lucide-react';
import { authService } from '../services/authService';
import UserSearchModal from './UserSearchModal';
import logo from '../assets/logo_header_dark.png';

export default function Navbar() {
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [isSearchUserOpen, setIsSearchUserOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await authService.getProfile();

        if (user) {
          setUserName(user.user.name);
          setUserRole(user.role);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchProfile();
  }, []);

  // Close mobile menu whenever location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="sticky top-0 z-40 mb-8 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
        {/* Brand Logo */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 transition-transform duration-150 hover:scale-105 active:scale-95"
        >
          <div className="logo-wrapper">
            <img src={logo} alt="CritiPlay" className="navbar-logo" />
          </div>
        </Link>

        {/* DESKTOP NAVIGATION (Hidden on mobile) */}
        <div className="hidden md:flex items-center gap-4">
          {/* Admin Panel */}
          {userRole === 'admin' && (
            <>
              <Link
                to="/admin"
                className={`text-sm font-semibold transition-colors ${
                  location.pathname.startsWith('/admin')
                    ? 'text-purple-300 font-bold'
                    : 'text-purple-400 hover:text-purple-300'
                }`}
              >
                Admin Panel
              </Link>
              <span className="text-slate-800">|</span>
            </>
          )}

          {/* Library */}
          <Link
            to="/library"
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/library'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Library
          </Link>

          <span className="text-slate-800">|</span>

          {/* Profile */}
          <Link
            to="/profile"
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/profile'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Profil
          </Link>

          <span className="text-slate-800">|</span>

          {/* Greeting */}
          <span className="text-sm font-medium text-slate-400">
            Halo, <strong className="font-semibold text-slate-200">{userName || 'Gamer'}</strong>!
          </span>

          {/* Add Friend */}
          <button
            type="button"
            onClick={() => setIsSearchUserOpen(true)}
            title="Add Friend"
            aria-label="Add Friend"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-400 shadow-sm transition-all duration-150 hover:scale-105 active:scale-95 hover:border-indigo-500/30 hover:bg-indigo-600/10 hover:text-indigo-400"
          >
            <UserPlus className="h-4 w-4" />
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Logout"
            className="group flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-sm font-bold text-slate-300 shadow-sm transition-all duration-150 hover:scale-105 active:scale-95 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                <span>Keluar...</span>
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 text-slate-400 transition-colors group-hover:text-red-400" />
                <span>Logout</span>
              </>
            )}
          </button>
        </div>

        {/* MOBILE 3-LINE (HAMBURGER) BUTTON (Visible only on mobile) */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'Tutup Menu' : 'Buka Menu'}
            className="flex h-9.5 w-9.5 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 shadow-sm transition-all hover:border-slate-700 hover:text-white active:scale-95"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 text-indigo-400 transition-transform rotate-90 duration-150" />
            ) : (
              <Menu className="h-5 w-5 text-slate-300 transition-transform duration-150" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU (Everything entered here on mobile) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-xl px-5 py-4 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          {/* User Profile Card */}
          <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 font-bold border border-indigo-500/30 shadow-sm">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Halo,</p>
                <p className="text-sm font-bold text-white">{userName || 'Gamer'}</p>
              </div>
            </div>

            {userRole === 'admin' && (
              <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300 border border-purple-500/30">
                Admin
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            {/* Library */}
            <Link
              to="/library"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                location.pathname === '/library'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
              }`}
            >
              <Gamepad2 className="h-4 w-4 text-indigo-400" />
              <span>Library Game</span>
            </Link>

            {/* Profile */}
            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                location.pathname === '/profile'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
              }`}
            >
              <User className="h-4 w-4 text-purple-400" />
              <span>Profil Saya</span>
            </Link>

            {/* Add Friend / Search User */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsSearchUserOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-900/80 hover:text-white transition-colors"
            >
              <UserPlus className="h-4 w-4 text-emerald-400" />
              <span>Cari Teman / Pengguna</span>
            </button>

            {/* Admin Panel (Conditional) */}
            {userRole === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-purple-400 hover:bg-slate-900/80 hover:text-purple-300'
                }`}
              >
                <Shield className="h-4 w-4" />
                <span>Admin Panel</span>
              </Link>
            )}
          </div>

          {/* Logout Button */}
          <div className="mt-3.5 pt-3.5 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 px-4 text-sm font-bold text-rose-300 hover:bg-rose-500/20 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                  <span>Keluar...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 text-rose-400" />
                  <span>Logout</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* User Search Modal */}
      <UserSearchModal
        isOpen={isSearchUserOpen}
        onClose={() => setIsSearchUserOpen(false)}
      />
    </nav>
  );
}