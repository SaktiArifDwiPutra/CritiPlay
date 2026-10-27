import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService';
import { GOOGLE_AUTH_URL } from '../config/api';

const CARDS = [
  { title: 'Delands', sub: 'Koleksi pribadi', rating: '9.2', img: '/cover_delands.jpg' },
  { title: 'The Wild', sub: 'Koleksi pribadi', rating: '9.4', img: '/cover_the_wild.jpg' },
  { title: 'Emberfall', sub: 'Koleksi pribadi', rating: null, img: '/cover_emberfall.jpg' },
  { title: 'After Hours', sub: 'Koleksi pribadi', rating: '8.6', img: '/cover_after_hours.jpg' },
  { title: 'Orbital', sub: 'Koleksi pribadi', rating: null, img: '/cover_orbital.jpg' },
];

const GameCard = ({
  title,
  sub,
  rating,
  img,
  className = '',
}: {
  title: string;
  sub: string;
  rating: string | null;
  img: string;
  className?: string;
}) => (
  <div
    className={`relative overflow-hidden rounded-2xl bg-slate-800 ring-1 ring-white/10 ${className}`}
    style={{ aspectRatio: '2/3' }}
  >
    <img
      src={img}
      alt={title}
      loading="lazy"
      className="absolute inset-0 h-full w-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/20 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-white">{title}</p>
      <div className="mt-0.5 flex items-end justify-between">
        <p className="text-[10px] text-slate-400">{sub}</p>
        {rating && (
          <div className="text-right">
            <span className="text-sm font-bold text-slate-100">{rating}</span>
            <span className="ml-0.5 text-[10px] text-slate-500">/10</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

const MosaicPanel = ({
  flipped = false,
  labelOpacity = 1,
}: {
  flipped?: boolean;
  labelOpacity?: number;
}) => (
  <div className="relative h-full w-full overflow-hidden bg-slate-950">
    <div className="pointer-events-none absolute inset-0 z-10 bg-black/40" />
    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-slate-950 to-transparent" />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-slate-950 to-transparent" />

    <div
      className="absolute inset-0 flex origin-center items-start gap-4 p-4"
      style={{ transform: 'rotate(-8deg) scale(1.15) translateY(-6%)' }}
    >
      <div className="flex w-44 shrink-0 flex-col gap-4">
        <GameCard {...CARDS[0]} />
        <GameCard {...CARDS[3]} />
        <GameCard {...CARDS[1]} />
      </div>
      <div className="flex w-44 shrink-0 flex-col gap-4 pt-12">
        <GameCard {...CARDS[1]} />
        <GameCard {...CARDS[4]} />
        <GameCard {...CARDS[0]} />
      </div>
      <div className="flex w-44 shrink-0 flex-col gap-4 pt-4">
        <GameCard {...CARDS[2]} />
        <GameCard {...CARDS[3]} />
        <GameCard {...CARDS[4]} />
      </div>
    </div>

    <div
      className={`absolute top-7 z-20 flex items-center gap-2 ${
        flipped ? 'right-7 flex-row-reverse' : 'left-7'
      }`}
      style={{ opacity: labelOpacity, transition: 'opacity 0.28s ease' }}
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/30">
        C
      </div>
      <span className="text-base font-bold text-white">CritiPlay.</span>
    </div>

    <div
      className={`absolute bottom-0 z-20 p-8 ${
        flipped ? 'right-0 text-right' : 'left-0 text-left'
      }`}
      style={{ opacity: labelOpacity, transition: 'opacity 0.28s ease' }}
    >
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-indigo-400">
        {flipped ? 'game-mu. ceritamu. —' : '— game-mu. ceritamu.'}
      </p>
      <h2 className="text-2xl font-extrabold leading-snug text-white">
        Tempat pribadi untuk
        <br />
        mengingat apa yang
        <br />
        kamu mainkan.
      </h2>
      <p className="mt-3 text-sm text-slate-400">
        Simpan koleksimu, tulis ulasan,
        <br />
        dan temukan game yang berkesan.
      </p>
    </div>
  </div>
);

const InputField = ({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div>
    <label className="mb-1 block text-xs sm:text-sm font-semibold text-slate-300">
      {label}
    </label>
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      {children}
    </div>
  </div>
);

const INPUT_BASE =
  'h-11 w-full rounded-xl border bg-slate-800/60 text-base sm:text-sm text-slate-100 outline-none placeholder:text-slate-500 transition-colors focus:ring-2 focus:ring-indigo-500/25';

const EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';

export default function AuthPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [labelFlipped, setLabelFlipped] = useState(false);
  const [labelOpacity, setLabelOpacity] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  const googleError =
    searchParams.get('error') === 'google_failed'
      ? 'Login dengan Google dibatalkan atau gagal.'
      : '';

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // On desktop only: lock background scroll
  useEffect(() => {
    if (!isDesktop) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverscroll = document.body.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overscrollBehavior = prevBodyOverscroll;
    };
  }, [isDesktop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLoginMode) {
        await authService.login(email, password);
        navigate('/');
      } else {
        if (password !== passwordConfirmation) {
          setError('Konfirmasi password tidak cocok.');
          return;
        }
        await authService.register(name, email, password, passwordConfirmation);
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

  const switchMode = () => {
    setHasInteracted(true);
    setIsLoginMode((p) => !p);
    setError('');
    setName('');
    setPassword('');
    setPasswordConfirmation('');
    setLabelOpacity(0);
    setTimeout(() => {
      setLabelFlipped((p) => !p);
      setLabelOpacity(1);
    }, 350);
  };

  const panelTransition = hasInteracted && isDesktop
    ? `left 0.7s ${EASE}, right 0.7s ${EASE}`
    : 'none';

  const mosaicLeft = isLoginMode ? '0%' : '48%';
  const formLeft = isLoginMode ? '52%' : '0%';

  return (
    <div
      className={`bg-slate-950 text-slate-100 no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
        isDesktop
          ? 'fixed inset-0 h-screen h-[100dvh] w-screen overflow-hidden'
          : 'relative min-h-[100dvh] w-full overflow-y-auto flex flex-col justify-between py-4 px-4 sm:px-6'
      }`}
    >
      {/* DESKTOP MOSAIC PANEL (Sliding Split-Screen) */}
      <div
        className="absolute top-0 hidden h-full w-[52%] lg:block"
        style={{ left: mosaicLeft, transition: panelTransition }}
      >
        <MosaicPanel flipped={labelFlipped} labelOpacity={labelOpacity} />
      </div>

      {/* MOBILE TOP AMBIENT MOSAIC SHOWCASE (Maintains visual identity on mobile) */}
      <div className="relative w-full h-32 sm:h-40 overflow-hidden lg:hidden shrink-0 rounded-2xl mb-2">
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-slate-950/20 via-slate-950/60 to-slate-950" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-slate-950 to-transparent" />

        {/* Angled miniature game cards */}
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 origin-center opacity-60"
          style={{ transform: 'translateX(-50%) rotate(-6deg) scale(0.9)' }}
        >
          <div className="w-20 sm:w-24 shrink-0">
            <GameCard {...CARDS[0]} />
          </div>
          <div className="w-20 sm:w-24 shrink-0 -mt-5">
            <GameCard {...CARDS[1]} />
          </div>
          <div className="w-20 sm:w-24 shrink-0 mt-3">
            <GameCard {...CARDS[3]} />
          </div>
          <div className="w-20 sm:w-24 shrink-0 -mt-3">
            <GameCard {...CARDS[4]} />
          </div>
        </div>

        {/* Mobile Header Logo */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/30">
            C
          </div>
          <span className="text-base font-bold text-white">CritiPlay.</span>
        </div>
      </div>

      {/* FORM CONTAINER (Slide on Desktop, Centered on Mobile) */}
      <div
        className={`flex w-full flex-col items-center justify-center ${
          isDesktop
            ? 'absolute top-0 h-full w-[48%] overflow-hidden px-8 lg:px-12'
            : 'relative max-w-[400px] mx-auto py-2'
        }`}
        style={
          isDesktop
            ? { left: formLeft, transition: panelTransition }
            : { left: '0%' }
        }
      >
        <div className="flex w-full max-w-[360px] flex-col items-center">
          {/* Mobile Tab Switcher */}
          <div className="flex w-full rounded-xl bg-slate-900/90 p-1 border border-slate-800/80 mb-4 lg:hidden">
            <button
              type="button"
              onClick={() => !isLoginMode && switchMode()}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                isLoginMode
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => isLoginMode && switchMode()}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                !isLoginMode
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Daftar Akun
            </button>
          </div>

          <div className="w-full">
            <h1 className="text-2xl font-extrabold text-white">
              {isLoginMode ? 'Selamat datang kembali' : 'Buat akun baru'}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {isLoginMode ? 'Lanjutkan catatan game-mu.' : 'Mulai catat perjalanan gaming-mu.'}
            </p>

            {(error || googleError) && (
              <div className="mt-3 rounded-xl bg-red-500/10 px-4 py-2.5 text-xs sm:text-sm font-medium text-red-400 ring-1 ring-red-500/20">
                {error || googleError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-2.5 sm:space-y-3">
              {!isLoginMode && (
                <InputField label="Nama Lengkap" icon={User}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Nama kamu"
                    className={`${INPUT_BASE} border-slate-700 pl-10 pr-4 focus:border-indigo-500`}
                  />
                </InputField>
              )}

              <InputField
                label={`Email${isLoginMode ? ' atau Username' : ''}`}
                icon={Mail}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="alex@contoh.com"
                  className={`${INPUT_BASE} border-indigo-500 pl-10 pr-4`}
                />
              </InputField>

              <InputField label="Password" icon={Lock}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••••"
                  className={`${INPUT_BASE} border-slate-700 pl-10 pr-12 focus:border-indigo-500`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </InputField>

              {isLoginMode && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs sm:text-sm font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
                  >
                    Lupa password?
                  </button>
                </div>
              )}

              {!isLoginMode && (
                <InputField label="Konfirmasi Password" icon={Lock}>
                  <input
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    required
                    placeholder="Ulangi password"
                    className={`${INPUT_BASE} border-slate-700 pl-10 pr-4 focus:border-indigo-500`}
                  />
                </InputField>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="mt-1 flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-60"
              >
                {isLoading ? 'Memproses...' : isLoginMode ? 'Masuk' : 'Daftar Sekarang'}
              </button>
            </form>

            <div className="my-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-800" />
              <span className="text-xs font-medium text-slate-500">atau</span>
              <span className="h-px flex-1 bg-slate-800" />
            </div>

            <button
              type="button"
              onClick={() => (window.location.href = GOOGLE_AUTH_URL)}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Lanjutkan dengan Google
            </button>

            <p className="mt-4 text-center text-sm text-slate-500">
              {isLoginMode ? 'Belum punya akun? ' : 'Sudah punya akun? '}
              <button
                type="button"
                onClick={switchMode}
                className="font-bold text-indigo-400 transition-colors hover:text-indigo-300"
              >
                {isLoginMode ? 'Daftar' : 'Masuk di sini'}
              </button>
            </p>
          </div>

          <p className="mt-5 mb-2 flex items-center gap-1.5 text-xs text-slate-600">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            <span>Koleksimu personal. Datamu tetap aman.</span>
          </p>
        </div>
      </div>
    </div>
  );
}