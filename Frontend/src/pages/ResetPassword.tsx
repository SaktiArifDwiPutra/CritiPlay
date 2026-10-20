import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { authService } from '../services/authService';

const PasswordField = ({
  id, label, value, onChange, placeholder, withToggle = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  withToggle?: boolean;
}) => {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-300">
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          id={id}
          type={withToggle && show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          minLength={6}
          placeholder={placeholder}
          className={`h-12 w-full rounded-xl border border-slate-700 bg-slate-800/60 pl-10 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 ${
            withToggle ? 'pr-12' : 'pr-4'
          }`}
        />
        {withToggle && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Sembunyikan' : 'Tampilkan'}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
};

export default function ResetPassword() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();

  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage('');
    setError('');

    if (!token) {
      setError('Token reset password tidak ditemukan.');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await authService.resetPassword(
        token,
        email,
        password,
        passwordConfirmation
      );

      setMessage(data.message);

      setTimeout(() => {
        navigate('/login');
      }, 1500);
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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10">
      <div className="w-full max-w-[400px]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              C
            </div>
            <span className="text-base font-bold text-white">CritiPlay.</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Password baru</h1>
          <p className="mt-1 text-sm text-slate-400">Buat password baru untuk akun kamu.</p>

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

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <PasswordField
              id="password"
              label="Password Baru"
              value={password}
              onChange={setPassword}
              placeholder="Minimal 6 karakter"
              withToggle
            />

            <PasswordField
              id="password-confirmation"
              label="Konfirmasi Password"
              value={passwordConfirmation}
              onChange={setPasswordConfirmation}
              placeholder="Ulangi password"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
            >
              {isLoading ? 'Mereset...' : 'Reset Password'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="font-bold text-indigo-400 transition-colors hover:text-indigo-300"
            >
              Kembali ke login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}