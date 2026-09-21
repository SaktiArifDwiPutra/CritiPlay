import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';

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
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            Reset Password
          </h1>
          <p className="text-slate-500 font-medium">
            Buat password baru untuk akun kamu.
          </p>
        </div>

        {message && (
          <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm font-semibold mb-6">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Password Baru
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Konfirmasi Password
            </label>

            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              minLength={6}
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm disabled:opacity-70"
          >
            {isLoading ? 'Mereset...' : 'Reset Password'}
          </button>

        </form>

      </div>
    </div>
  );
}

