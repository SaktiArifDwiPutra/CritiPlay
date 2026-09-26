import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';

export default function AuthPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Menangkap error jika user batal login dari layar Google
  useEffect(() => {
    if (searchParams.get('error') === 'google_failed') {
      setError('Login dengan Google dibatalkan atau gagal.');
    }
  }, [searchParams]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    if (isLoginMode) {
      await authService.login(email, password);
      navigate('/');
    } else {
      await authService.register(name, email, password);
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      const status = (err as Error & { status?: number }).status;

      if (status === 403 && isLoginMode) {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
        return;
      }

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

<div className="flex justify-end -mt-2">
  {isLoginMode && (
    <button
      type="button"
      onClick={() => navigate('/forgot-password')}
      className="text-sm font-semibold text-blue-600 hover:underline"
    >
      Lupa password?
    </button>
  )}
</div>

          </div>

          <button 
            type="submit" disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm disabled:opacity-70 mt-4"
          >
            {isLoading ? 'Memproses...' : (isLoginMode ? 'Masuk' : 'Daftar Sekarang')}
          </button>
        </form>

        {/* --- MULAI BAGIAN GOOGLE LOGIN --- */}
        <div className="mt-6 flex items-center justify-between">
          <span className="w-1/5 border-b border-slate-200 lg:w-1/4"></span>
          <span className="text-xs text-center text-slate-500 font-semibold uppercase">Atau masuk dengan</span>
          <span className="w-1/5 border-b border-slate-200 lg:w-1/4"></span>
        </div>

        <button
          type="button"
          onClick={() => window.location.href = 'http://127.0.0.1:8000/auth/google/redirect'}
          className="w-full mt-6 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>
        {/* --- AKHIR BAGIAN GOOGLE LOGIN --- */}

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