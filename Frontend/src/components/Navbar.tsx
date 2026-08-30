import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function Navbar() {
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await authService.getProfile();
        if (user) setUserName(user.name);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 mb-8 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-extrabold text-blue-600 tracking-tight">
          CritiPlay
        </Link>
        
        <div className="flex items-center gap-4">
            <Link to="/profile" className="text-slate-600 hover:text-blue-600 font-medium text-sm transition-colors hidden sm:inline-block">
                Profil
            </Link>
            <span className="text-slate-300 hidden sm:inline-block">|</span>
            <span className="text-slate-600 font-medium hidden sm:inline-block">
                Halo, <strong className="text-slate-800">{userName || 'Gamer'}</strong>!
            </span>

          <button 
            onClick={handleLogout}
            className="bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 hover:border-red-200 transition-all shadow-sm">
            Logout
          </button>
        </div>
        
      </div>
    </nav>
  );
}