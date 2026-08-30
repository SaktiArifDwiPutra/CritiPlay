import { useState } from 'react';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGame: (gameData: {
    title: string;
    coverImage: string;
    developer: string;
    releaseDate: string;
    genres: string[];
  }) => void;
}

export default function AddGameModal({ isOpen, onClose, onAddGame }: AddGameModalProps) {
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [developer, setDeveloper] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [genreInput, setGenreInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ubah string genre yang dipisah koma menjadi array (misal: "Action, RPG" -> ["Action", "RPG"])
    const genres = genreInput.split(',').map((g) => g.trim()).filter(Boolean);

    onAddGame({
      title,
      coverImage: coverImage || 'https://images.igdb.com/igdb/image/upload/t_cover_big/nocover.png',
      developer,
      releaseDate,
      genres: genres.length > 0 ? genres : ['Action']
    });

    // Reset form
    setTitle('');
    setCoverImage('');
    setDeveloper('');
    setReleaseDate('');
    setGenreInput('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Tambah Game Baru</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Judul Game</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: God of War Ragnarok"
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">URL Cover Image</label>
            <input 
              type="url" 
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://images.igdb.com/... (opsional)"
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Developer</label>
            <input 
              type="text" 
              value={developer}
              onChange={(e) => setDeveloper(e.target.value)}
              placeholder="Contoh: Santa Monica Studio"
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Tanggal Rilis</label>
            <input 
              type="date" 
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Genre (Pisahkan dengan koma)</label>
            <input 
              type="text" 
              value={genreInput}
              onChange={(e) => setGenreInput(e.target.value)}
              placeholder="Action, Adventure, RPG"
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Simpan Game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}