import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';

const CARDS = [
  { title: 'Delands',     sub: 'Koleksi pribadi', rating: '9.2', img: '/cover_delands.jpg'     },
  { title: 'The Wild',    sub: 'Koleksi pribadi', rating: '9.4', img: '/cover_the_wild.jpg'    },
  { title: 'Emberfall',   sub: 'Koleksi pribadi', rating: null,  img: '/cover_emberfall.jpg'   },
  { title: 'After Hours', sub: 'Koleksi pribadi', rating: '8.6', img: '/cover_after_hours.jpg' },
  { title: 'Orbital',     sub: 'Koleksi pribadi', rating: null,  img: '/cover_orbital.jpg'     },
];

const GameCard = ({
  title, sub, rating, img,
}: {
  title: string; sub: string; rating: string | null; img: string;
}) => (
  <div
    className="relative overflow-hidden rounded-2xl bg-slate-800 ring-1 ring-white/10"
    style={{ aspectRatio: '2/3' }}
  >
    <img src={img} alt={title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
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

const MosaicPanel = () => (
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

    <div className="absolute left-7 top-7 z-20 flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
        C
      </div>
      <span className="text-base font-bold text-white">CritiPlay.</span>
    </div>

    <div className="absolute bottom-0 left-0 z-20 p-8 text-left">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-indigo-400">
        — game-mu. ceritamu.
      </p>
      <h2 className="text-2xl font-extrabold leading-snug text-white">
        Tempat pribadi untuk<br />mengingat apa yang<br />kamu mainkan.
      </h2>
      <p className="mt-3 text-sm text-slate-400">
        Simpan koleksimu, tulis ulasan,<br />dan temukan game yang berkesan.
      </p>
    </div>
  </div>
);

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');
  const [error, setError]     = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);
    try {
      const data = await authService.forgotPassword(email);
      setMessage(data.message);
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
    <div className="flex h-screen overflow-hidden bg-slate-950">

      <div className="hidden h-full w-[52%] lg:block">
        <MosaicPanel />
      </div>
      <div className="flex h-full w-full flex-col items-center justify-center overflow-y-auto px-6 py-10 lg:w-[48%] lg:px-14">

        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">C</div>
          <span className="text-base font-bold text-white">CritiPlay.</span>
        </div>

        <div className="w-full max-w-[360px]">

          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/15 ring-1 ring-indigo-500/30">
            <Mail className="h-5 w-5 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Lupa Password?</h1>
          <p className="mt-1 text-sm text-slate-400">
            Masukkan email akun kamu. Kami akan mengirimkan link untuk reset password.
          </p>

          {message && (
            <div className="mt-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400 ring-1 ring-emerald-500/20">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 ring-1 ring-red-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-300">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama@email.com"
                  className="h-12 w-full rounded-xl border border-indigo-500 bg-slate-800/60 pl-10 pr-4 text-sm text-slate-100 outline-none placeholder:text-slate-500 transition-colors focus:ring-2 focus:ring-indigo-500/25"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
            >
              {isLoading ? 'Mengirim...' : 'Kirim Link Reset'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-6 flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke login
          </button>
        </div>

        <p className="mt-10 flex items-center gap-1.5 text-xs text-slate-600">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Koleksimu personal. Datamu tetap aman.
        </p>
      </div>
    </div>
  );
}