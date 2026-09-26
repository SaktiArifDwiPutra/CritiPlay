import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setMessage('');

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            Verifikasi Email
          </h1>

          <p className="text-slate-500">
            Masukkan kode OTP yang dikirim ke
          </p>

          <p className="font-bold text-slate-800 mt-1 break-all">
            {email || 'email kamu'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold mb-5">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm font-semibold mb-5">
            {message}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Kode OTP
            </label>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setOtp(value);
              }}
              placeholder="123456"
              className="w-full border border-slate-200 rounded-xl p-4 bg-slate-50 outline-none focus:border-blue-500 text-center text-2xl tracking-[0.5em] font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Memverifikasi...' : 'Verifikasi Email'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-500 mb-2">
            Tidak menerima OTP?
          </p>

          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-blue-600 hover:underline font-bold text-sm disabled:opacity-50"
          >
            {isResending ? 'Mengirim...' : 'Kirim Ulang OTP'}
          </button>
        </div>

      </div>
    </div>
  );
}