import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      localStorage.setItem('critiplay_token', token);
      
      setTimeout(() => {
        window.location.href = '/';
      }, 300);
    } else {
      console.error("Token Google tidak ditemukan di URL!");
      window.location.href = '/login?error=google_failed';
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-bold">Menyelesaikan autentikasi Google...</p>
      </div>
    </div>
  );
}