import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, LogOut, UserPlus } from 'lucide-react';
import { authService } from '../services/authService';
import UserSearchModal from './UserSearchModal';
import logo from '../assets/logo_header.png';

export default function Navbar() {
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [isSearchUserOpen, setIsSearchUserOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-8">

        {/* Logo */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 transition-transform duration-150 hover:scale-105 active:scale-95"
        >
        <div className="logo-wrapper">
          <img 
            src={logo}
            alt="CritiPlay Icon" 
            className="navbar-logo" 
          />
        </div>
        </Link>

        <div className="flex items-center gap-4">

          {/* Admin */}
          {userRole === 'admin' && (
            <>
              <Link
                to="/admin"
                className={`hidden text-sm font-semibold transition-colors sm:inline-block ${
                  location.pathname.startsWith('/admin')
                    ? 'text-purple-300 font-bold'
                    : 'text-purple-400 hover:text-purple-300'
                }`}
              >
                Admin Panel
              </Link>

              <span className="hidden text-slate-800 sm:inline-block">
                |
              </span>
            </>
          )}

          {/* Library */}
          <Link
            to="/library"
            className={`hidden text-sm font-medium transition-colors sm:inline-block ${
              location.pathname === '/library'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Library
          </Link>

          <span className="hidden text-slate-800 sm:inline-block">
            |
          </span>

          {/* Profile */}
          <Link
            to="/profile"
            className={`hidden text-sm font-medium transition-colors sm:inline-block ${
              location.pathname === '/profile'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            Profil
          </Link>

          <span className="hidden text-slate-800 sm:inline-block">
            |
          </span>

          {/* Greeting */}
          <span className="hidden text-sm font-medium text-slate-400 sm:inline-block">
            Halo,{' '}
            <strong className="font-semibold text-slate-200">
              {userName || 'Gamer'}
            </strong>
            !
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
      </div>

      {/* User Search Modal */}
      <UserSearchModal
        isOpen={isSearchUserOpen}
        onClose={() => setIsSearchUserOpen(false)}
      />
    </nav>
  );
}