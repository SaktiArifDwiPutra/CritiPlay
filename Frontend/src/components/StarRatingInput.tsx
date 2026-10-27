import { useState } from 'react';
import { Star } from 'lucide-react';

export interface RatingDescriptor {
  title: string;
  subtitle: string;
  textColor: string;
  badgeBg: string;
  starColor: string;
}

export const RATING_DESCRIPTIONS: Record<number, RatingDescriptor> = {
  1: {
    title: 'Appalling',
    subtitle: 'Sangat Buruk Sekali',
    textColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    starColor: 'fill-rose-500 text-rose-500',
  },
  2: {
    title: 'Very Bad',
    subtitle: 'Buruk Sekali',
    textColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    starColor: 'fill-rose-500 text-rose-500',
  },
  3: {
    title: 'Bad',
    subtitle: 'Buruk',
    textColor: 'text-orange-400',
    badgeBg: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    starColor: 'fill-orange-400 text-orange-400',
  },
  4: {
    title: 'Poor',
    subtitle: 'Kurang',
    textColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    starColor: 'fill-amber-400 text-amber-400',
  },
  5: {
    title: 'Average',
    subtitle: 'Biasa Saja',
    textColor: 'text-yellow-400',
    badgeBg: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    starColor: 'fill-yellow-400 text-yellow-400',
  },
  6: {
    title: 'Decent',
    subtitle: 'Lumayan',
    textColor: 'text-lime-400',
    badgeBg: 'bg-lime-500/15 text-lime-300 border-lime-500/30',
    starColor: 'fill-lime-400 text-lime-400',
  },
  7: {
    title: 'Fair',
    subtitle: 'Bagus',
    textColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    starColor: 'fill-emerald-400 text-emerald-400',
  },
  8: {
    title: 'Good',
    subtitle: 'Sangat Bagus',
    textColor: 'text-teal-400',
    badgeBg: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    starColor: 'fill-teal-400 text-teal-400',
  },
  9: {
    title: 'Very Good',
    subtitle: 'Luar Biasa',
    textColor: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    starColor: 'fill-indigo-400 text-indigo-400',
  },
  10: {
    title: 'Masterpiece',
    subtitle: 'Mahakarya',
    textColor: 'text-purple-300',
    badgeBg: 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-200 border-purple-500/40 shadow-sm shadow-purple-500/25',
    starColor: 'fill-amber-300 text-amber-300',
  },
};

interface StarRatingInputProps {
  value: number;
  onChange: (score: number) => void;
  label?: string;
  readOnly?: boolean;
}

export default function StarRatingInput({
  value,
  onChange,
  label,
  readOnly = false,
}: StarRatingInputProps) {
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);

  const displayScore = hoveredScore !== null ? hoveredScore : value;
  const currentDescriptor = displayScore > 0 ? RATING_DESCRIPTIONS[displayScore] : null;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">{label}</span>
          {displayScore > 0 && currentDescriptor ? (
            <span className={`font-bold transition-colors ${currentDescriptor.textColor}`}>
              {displayScore}/10 • {currentDescriptor.title}
            </span>
          ) : (
            <span className="text-slate-500">Belum diberi rating</span>
          )}
        </div>
      )}

      {/* Stars Container (1 to 10 with numbers underneath) */}
      <div
        className="flex items-center justify-between gap-1 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 select-none overflow-x-auto scrollbar-none"
        onMouseLeave={() => !readOnly && setHoveredScore(null)}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starNum) => {
          const isFilled = starNum <= displayScore;
          const isSelected = starNum === value;

          // Per-star active colors based on tier
          const activeDescriptor = RATING_DESCRIPTIONS[displayScore] || RATING_DESCRIPTIONS[starNum];

          return (
            <button
              key={starNum}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onChange(starNum)}
              onMouseEnter={() => !readOnly && setHoveredScore(starNum)}
              className={`group flex-1 min-w-[28px] sm:min-w-[34px] flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-all duration-150 ${
                readOnly
                  ? 'cursor-default'
                  : 'cursor-pointer hover:bg-slate-800/70 hover:scale-105 active:scale-95'
              } ${isSelected ? 'ring-1 ring-indigo-500/40 bg-indigo-500/10' : ''}`}
              title={`${starNum} - ${RATING_DESCRIPTIONS[starNum]?.title}`}
            >
              {/* Star Icon */}
              <Star
                className={`h-4 w-4 sm:h-5 sm:w-5 transition-all duration-150 ${
                  isFilled
                    ? `${activeDescriptor.starColor} drop-shadow-[0_0_6px_rgba(251,191,36,0.35)] scale-105`
                    : 'text-slate-600 fill-slate-800/50 group-hover:text-slate-400'
                }`}
              />

              {/* Number below each star */}
              <span
                className={`mt-1 text-[11px] sm:text-xs font-bold transition-colors ${
                  isFilled
                    ? `${activeDescriptor.textColor}`
                    : 'text-slate-500 group-hover:text-slate-300'
                }`}
              >
                {starNum}
              </span>
            </button>
          );
        })}
      </div>

      {/* Description Below the Stars Row */}
      <div className="min-h-[30px] flex items-center justify-between px-1">
        {currentDescriptor && displayScore > 0 ? (
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-semibold animate-in fade-in zoom-in-95 duration-150 ${currentDescriptor.badgeBg}`}
          >
            <span className="font-extrabold">{displayScore} / 10</span>
            <span className="w-1 h-1 rounded-full bg-current opacity-60" />
            <span className="font-bold">{currentDescriptor.title}</span>
            <span className="opacity-75 hidden sm:inline">({currentDescriptor.subtitle})</span>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic">
            Sentuh atau klik bintang (1-10) untuk memilih rating
          </p>
        )}

        {hoveredScore !== null && hoveredScore !== value && (
          <span className="text-[10px] text-indigo-400 font-medium">Klik untuk konfirmasi</span>
        )}
      </div>
    </div>
  );
}
