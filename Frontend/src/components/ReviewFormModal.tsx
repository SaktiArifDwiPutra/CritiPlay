import { useState, useEffect } from 'react';
import type { GameStatus, RatingAspect, Review } from '../types';

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (status: GameStatus, aspects: RatingAspect[], content: string) => void;
  initialData?: Review | null; // <--- Tambahan baru
}

export default function ReviewFormModal({ isOpen, onClose, onSubmit, initialData }: ReviewFormModalProps) {
  const [status, setStatus] = useState<GameStatus>('Playing');
  const [content, setContent] = useState('');
  const [aspects, setAspects] = useState<RatingAspect[]>([
    { aspect: 'Gameplay', score: 0 }, { aspect: 'Visual', score: 0 }, { aspect: 'Story', score: 0 }
  ]);

  // Effect untuk mengisi form saat mode Edit
  useEffect(() => {
    if (isOpen && initialData) {
      setStatus(initialData.status);
      setContent(initialData.content);
      // Duplikat array agar tidak mengubah data asli secara tidak sengaja
      setAspects(initialData.aspectRatings.map(a => ({ ...a })));
    } else if (isOpen && !initialData) {
      // Reset jika mode Tambah Baru
      setStatus('Playing');
      setContent('');
      setAspects([{ aspect: 'Gameplay', score: 0 }, { aspect: 'Visual', score: 0 }, { aspect: 'Story', score: 0 }]);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleScoreChange = (index: number, newScore: number) => {
    const newAspects = [...aspects];
    newAspects[index].score = newScore;
    setAspects(newAspects);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(status, aspects, content);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          {initialData ? 'Edit Jurnal' : 'Tulis Jurnal Baru'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Status Game</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as GameStatus)} className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:border-blue-500">
              <option value="Playing">Playing</option>
              <option value="Completed">Completed</option>
              <option value="Dropped">Dropped</option>
              <option value="Plan to Play">Plan to Play</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-3">Rating (1-10)</label>
            <div className="space-y-3">
              {aspects.map((aspect, index) => (
                <div key={aspect.aspect} className="flex items-center gap-4">
                  <span className="w-24 text-sm font-medium text-slate-600">{aspect.aspect}</span>
                  <input type="range" min="0" max="10" value={aspect.score} onChange={(e) => handleScoreChange(index, Number(e.target.value))} className="flex-1 accent-blue-600" />
                  <span className="w-8 text-right font-bold text-slate-800">{aspect.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Catatan Jurnal</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:border-blue-500 resize-none" required></textarea>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors">Batal</button>
            <button type="submit" className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm">
              {initialData ? 'Update Jurnal' : 'Simpan Jurnal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}