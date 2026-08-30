import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await authService.getProfile();
        if (user) {
          setName(user.name);
          setEmail(user.email);
          setAvatar(user.avatar);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadProfile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Bikin preview gambar instan
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      if (selectedFile) {
        formData.append('avatar', selectedFile);
      }

      const res = await authService.updateProfile(formData);
      setMessage('Profil berhasil diperbarui!');
      if (res.user.avatar) {
        setAvatar(res.user.avatar);
      }
      setSelectedFile(null);
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
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mt-6">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Pengaturan Profil</h1>

      {message && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-semibold mb-6">{message}</div>}
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bagian Avatar */}
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-slate-400">{name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Foto Profil</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">Nama Lengkap</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:border-blue-500" />
        </div>

        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm disabled:opacity-70">
          {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  );
}