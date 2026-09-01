import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Tangkap token dari parameter URL
    const token = searchParams.get('token');
    
    if (token) {
      // 1. Simpan token ke localStorage browser
      localStorage.setItem('critiplay_token', token);
      
      // 2. Beri jeda sepersekian detik untuk memastikan tersimpan, lalu lempar ke Beranda
      setTimeout(() => {
        window.location.href = '/';
      }, 300);
    } else {
      // Jika token tidak ada di URL, baru lempar ke halaman login
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