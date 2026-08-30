import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function AuthPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
    if (isLoginMode) {
        await authService.login(email, password);
    } else {
        await authService.register(name, email, password);
    }
    navigate('/');
    } catch (err: unknown) {
    if (err instanceof Error) {
        setError(err.message);
    } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
    }
    } finally {
    setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">CritiPlay</h1>
          <p className="text-slate-500 font-medium">
            {isLoginMode ? 'Masuk ke jurnal game kamu' : 'Mulai catat perjalanan gaming-mu'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLoginMode && (
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">Nama Lengkap</label>
              <input 
                type="text" value={name} onChange={(e) => setName(e.target.value)} required 
                className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:border-blue-500" 
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Email</label>
            <input 
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required 
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:border-blue-500" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Password</label>
            <input 
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:border-blue-500" 
            />
          </div>

          <button 
            type="submit" disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm disabled:opacity-70 mt-4"
          >
            {isLoading ? 'Memproses...' : (isLoginMode ? 'Masuk' : 'Daftar Sekarang')}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-slate-500">
          {isLoginMode ? "Belum punya akun? " : "Sudah punya akun? "}
          <button 
            onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }}
            className="text-blue-600 hover:underline font-bold"
          >
            {isLoginMode ? 'Daftar di sini' : 'Masuk di sini'}
          </button>
        </div>
      </div>
    </div>
  );
}