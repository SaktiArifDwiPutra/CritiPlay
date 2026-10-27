import { useState, useMemo } from 'react';
import { X, Sparkles, Star } from 'lucide-react';
import type { RatingAspect, Review } from '../types';
import StarRatingInput, { RATING_DESCRIPTIONS } from './StarRatingInput';

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    aspects: RatingAspect[],
    content: string
  ) => void;
  initialData?: Review | null;
}

export default function ReviewFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: ReviewFormModalProps) {
  const [content, setContent] = useState(
    initialData?.reviewText ?? ''
  );

  const [aspects, setAspects] = useState<RatingAspect[]>([
    {
      aspect: 'Gameplay',
      score: initialData?.ratingGameplay ?? 8,
    },
    {
      aspect: 'Visual',
      score: initialData?.ratingVisual ?? 8,
    },
    {
      aspect: 'Story',
      score: initialData?.ratingStory ?? 8,
    },
  ]);

  const overallScore = useMemo(() => {
    if (aspects.length === 0) return 0;
    const sum = aspects.reduce((acc, curr) => acc + (curr.score || 0), 0);
    return Math.round((sum / aspects.length) * 10) / 10;
  }, [aspects]);

  const roundedOverall = Math.round(overallScore);
  const overallDescriptor = RATING_DESCRIPTIONS[roundedOverall] || RATING_DESCRIPTIONS[8];

  if (!isOpen) return null;

  const handleScoreChange = (index: number, newScore: number) => {
    setAspects((currentAspects) =>
      currentAspects.map((aspect, i) =>
        i === index
          ? { ...aspect, score: newScore }
          : aspect
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (aspects.some((aspect) => aspect.score < 1)) {
      alert('Semua rating harus diisi minimal 1.');
      return;
    }

    onSubmit(aspects, content);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-7 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto scrollbar-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">
                {initialData ? 'Edit Jurnal Game' : 'Tulis Jurnal Baru'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Bagikan pengalaman, skor per aspek, dan catatan ulasanmu.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Live Overall Score Preview */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <div>
              <p className="text-xs font-semibold text-slate-400">Rata-rata Skor Keseluruhan</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-black text-white">
                  {overallScore.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500">/ 10</span>
                {overallDescriptor && (
                  <span
                    className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold border ${overallDescriptor.badgeBg}`}
                  >
                    {overallDescriptor.title}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-xl">
              <Star className="h-4 w-4 fill-amber-400" />
              <span className="text-sm font-bold">{overallScore.toFixed(1)}</span>
            </div>
          </div>

          {/* Rating Aspects with StarRatingInput */}
          <div className="space-y-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Penilaian Aspek Game
            </p>

            {aspects.map((aspect, index) => (
              <div
                key={aspect.aspect}
                className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-3.5"
              >
                <StarRatingInput
                  label={aspect.aspect}
                  value={aspect.score}
                  onChange={(newScore) => handleScoreChange(index, newScore)}
                />
              </div>
            ))}
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Catatan Jurnal / Ulasan
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={2000}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 p-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/25 resize-none"
              placeholder="Bagikan opini, gameplay flow, cerita, atau kelebihan dan kekurangan game ini..."
              required
            />
            <div className="flex justify-end mt-1">
              <span className="text-[11px] text-slate-500">{content.length}/2000</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-800/50 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            >
              Batal
            </button>

            <button
              type="submit"
              className="flex-1 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-95"
            >
              {initialData ? 'Perbarui Jurnal' : 'Simpan Jurnal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
