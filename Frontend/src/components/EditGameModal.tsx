import { useState, useEffect } from 'react';
import type { Game } from '../types';

interface EditGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
  onUpdate: (updatedData: Partial<Game>) => void;
}

export default function EditGameModal({ isOpen, onClose, game, onUpdate }: EditGameModalProps) {
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [developer, setDeveloper] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [genreInput, setGenreInput] = useState('');

  // Mengisi form dengan data game saat ini setiap kali modal dibuka
  useEffect(() => {
    if (isOpen && game) {
      setTitle(game.title);
      setCoverImage(game.coverImage);
      setDeveloper(game.developer);
      setReleaseDate(game.releaseDate);
      setGenreInput(game.genres.join(', '));
    }
  }, [isOpen, game]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const genres = genreInput.split(',').map((g) => g.trim()).filter(Boolean);
    onUpdate({
      title,
      coverImage,
      developer,
      releaseDate,
      genres: genres.length > 0 ? genres : ['Action']
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Edit Game</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Judul Game</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:border-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">URL Cover Image</label>
            <input type="url" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Developer</label>
            <input type="text" value={developer} onChange={(e) => setDeveloper(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:border-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Tanggal Rilis</label>
            <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:border-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Genre (Pisahkan dengan koma)</label>
            <input type="text" value={genreInput} onChange={(e) => setGenreInput(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:border-blue-500" required />
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors">Batal</button>
            <button type="submit" className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm">Simpan Perubahan</button>
          </div>
        </form>
      </div>
    </div>
  );
}