import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');

    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    if (clean.length > 1) {
      const next = [...digits];
      for (let i = 0; i < clean.length && index + i < 6; i++) {
        next[index + i] = clean[i];
      }
      setDigits(next);
      const nextIndex = Math.min(index + clean.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      } else {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = [...digits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || '';
    }
    setDigits(next);
    const targetIdx = Math.min(pasted.length, 5);
    inputRefs.current[targetIdx]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setMessage('');

    const otp = digits.join('');

    if (otp.length !== 6) {
      setError('OTP harus terdiri dari 6 digit.');
      return;
    }

    if (!email) {
      setError('Email tidak ditemukan.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.verifyOtp(email, otp);
      navigate('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Verifikasi OTP gagal.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');

    if (!email) {
      setError('Email tidak ditemukan.');
      return;
    }

    setIsResending(true);

    try {
      const data = await authService.resendOtp(email);
      setMessage(data.message || 'OTP baru berhasil dikirim.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal mengirim ulang OTP.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const isComplete = digits.join('').length === 6;

  return (
    <div className="relative flex h-screen min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-slate-950 px-4">

      <div className="relative z-10 w-full max-w-[420px] rounded-3xl border border-slate-800/80 bg-slate-900/85 p-7 sm:p-9 shadow-2xl shadow-black/80 backdrop-blur-xl ring-1 ring-white/10">

        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/30">
            C
          </div>
          <span className="text-base font-bold tracking-tight text-white">CritiPlay.</span>
        </div>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/15 ring-1 ring-indigo-500/30">
          <ShieldCheck className="h-7 w-7 text-indigo-400" />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-white">Verifikasi Email</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Masukkan 6 digit kode OTP yang kami kirim ke
          </p>
          <div className="mt-2.5 flex justify-center">
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-800/80 px-3.5 py-1 text-xs font-semibold text-slate-200">
              <Mail className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
              <span className="truncate max-w-[240px]">{email || 'email kamu'}</span>
            </div>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-xl bg-emerald-500/10 px-4 py-3 text-center text-sm font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm font-medium text-red-400 ring-1 ring-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="mt-6">
          <div className="flex items-center justify-between gap-2 sm:gap-2.5">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
                className={`h-13 w-11 sm:h-14 sm:w-12 rounded-xl text-center text-2xl font-extrabold outline-none transition-all ${
                  digit
                    ? 'border-indigo-500 bg-slate-800 text-white ring-2 ring-indigo-500/20'
                    : 'border-slate-700 bg-slate-800/60 text-slate-200 hover:border-slate-600 focus:border-indigo-500 focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/25'
                } border`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || !isComplete}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Memverifikasi...' : 'Verifikasi Akun'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Tidak menerima kode?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300 hover:underline disabled:opacity-50"
            >
              {isResending ? 'Mengirim ulang...' : 'Kirim Ulang OTP'}
            </button>
          </p>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke login
          </button>
        </div>

      </div>

      <p className="mt-8 flex items-center gap-1.5 text-xs text-slate-600">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Koleksimu personal. Datamu tetap aman.
      </p>
    </div>
  );
}