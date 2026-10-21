import { Link } from 'react-router-dom';
import { Gamepad2, Heart, ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md text-slate-400">
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-8 sm:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4 md:col-span-1">
            <Link
              to="/"
              className="group inline-flex items-center gap-2.5 transition-transform duration-150 hover:scale-105 active:scale-95"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/30 transition-colors group-hover:bg-indigo-500">
                C
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                CritiPlay<span className="text-indigo-400">.</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-400">
              Platform ulasan dan eksplorasi game komunitas dengan penilaian multi-aspek mendalam: Gameplay, Story, dan Visual.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-[11px] text-slate-400">
              <Gamepad2 className="h-3.5 w-3.5 text-indigo-400" />
              <span>Didukung data IGDB</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Navigasi
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/"
                  className="transition-colors hover:text-indigo-400"
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  to="/library"
                  className="transition-colors hover:text-indigo-400"
                >
                  Library Saya
                </Link>
              </li>
              <li>
                <Link
                  to="/stats"
                  className="transition-colors hover:text-indigo-400"
                >
                  Statistik Game
                </Link>
              </li>
              <li>
                <Link
                  to="/profile"
                  className="transition-colors hover:text-indigo-400"
                >
                  Profil Pengguna
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Aspek Ulasan
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                <span>Gameplay & Mekanik</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                <span>Story & Narasi</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span>Visual, Seni & Audio</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>Overall Community Score</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Komunitas
            </h4>
            <p className="text-xs leading-relaxed text-slate-400">
              Bagikan pengalaman bermainmu, tulis review objektif, dan temukan game favorit berikutnya.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={scrollToTop}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white"
              >
                <ArrowUp className="h-3.5 w-3.5 text-indigo-400" />
                <span>Kembali ke atas</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-800/60 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} CritiPlay. Hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-1 text-slate-500">
            <span>Dibuat dengan</span>
            <Heart className="h-3.5 w-3.5 fill-red-500/20 text-red-400" />
            <span>untuk gamer Indonesia</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
